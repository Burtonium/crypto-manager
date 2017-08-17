const RippleAPI = require('ripple-lib').RippleAPI;
const api = new RippleAPI({
    server: 'ws://localhost:6006'
});
const assert = require('assert');

// server: ws://localhost:6006
// wss://s.altnet.rippletest.net:51233

const {
    CryptoServer,
    State
} = require('../../cryptoserver');
const addressesPath = __dirname + '/.addresses.json';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const bs58 = require('base-x')(BASE58);
const BigNumber = require('bignumber.js');
const transactions = require("../../db/transactions");
var exec = require('child_process').exec;

function toDrop(amount) {
    let x = new BigNumber(amount);
    return x.times(1000000);
}

class RippleTransaction {
    constructor(args) {
        this.txid = args.txid.toString('hex');
        this.block = null;
        this.created = Date.parse(args.created);
        this.from = args.from ? bs58.encode(args.from) : null;
        this.to = args.to ? bs58.encode(args.to) : null;
        this.value = new BigNumber(args.value);
        this.currency = 'xrp',
            this.fee = args.fee || null;
    }

    static serialize(args) {
        return {
            txid: Buffer.from(args.txid || args.id, 'hex'),
            block: args.block || args.outcome.ledgerVersion,
            created: args.created || args.outcome.timestamp,
            from: bs58.decode(args.from || args.specification.source.address),
            to: bs58.decode(args.to || args.specification.destination.address),
            value: toDrop(args.value || args.outcome.deliveredAmount.value).toString(),
            currency: 'xrp',
            fee: toDrop(args.fee || args.outcome.fee).toString()
        };
    }
}

class RippleServer extends CryptoServer {
    constructor() {
        super('xrp');
        super.TransactionType = RippleTransaction;
    }

    async init() {
        await Promise.all([api.connect(), super.loadAddresses(addressesPath)]);

        api.on('ledger', (ledger) => {
            this.syncTransactions(ledger.ledgerVersion);
            console.log('Ripple server synced ledger ', ledger.ledgerVersion);
        });
        this.state = State.Idle;
    }

    update() {
        if (this.state !== State.Syncing) {
            this.syncToDb();
        }
    }

    async syncToDb() {
        this.state = State.Syncing;

        let lastSynched = await this.getSyncState();

        assert(lastSynched, 'Couldn\'t fetch last synched ledger: ' + this.currency);
        let currentLedger = await this.currentLedger();
        while (lastSynched.block < currentLedger) {
            await this.updateAvailableLedgers();
            let ledgerToSync = this.nextAvailableLedger(lastSynched.block);
            console.log(this.completeLedgers);
            console.log(ledgerToSync);
            lastSynched.hash = await this.syncTransactions(ledgerToSync);
            lastSynched.block = ledgerToSync;
            lastSynched = await this.updateSyncState(lastSynched);
            console.log('Synched Ripple ledger ' + lastSynched.block + ' with the database');
            currentLedger = await this.currentLedger();
        }

        console.log('Ripple server up to date');

        this.state = State.Idle;
    }

    currentBlock() {
        return this.currentLedger();
    }

    async currentLedger() {
        return await api.getLedgerVersion();
    }

    // async getAddressTransactions() {
    //     let asyncPromises = [];
    //     for (let address in super.addresses) {
    //         let t = api.getTransactions(address);
    //         asyncPromises.push(t);
    //     }
    //     let results = await Promise.all(asyncPromises);
    //     return results;
    // }


    async updateAvailableLedgers() {
        let serverInfo = await api.getServerInfo();
        let ranges = serverInfo.completeLedgers.split(',');
        this.completeLedgers = ranges.map((range) => {
            if (range.indexOf('-') === -1) {
                range += ('-' + range);
            }
            return range.split('-').map((number) => {
                return parseInt(number);
            });
        });
        return this.completeLedgers;
    }

    async syncTransactions(ledgerVersion) {
        const ledger = await api.getLedger({
            includeTransactions: true,
            ledgerVersion: ledgerVersion
        });

        if (ledger.transactionHashes && ledger.transactionHashes.constructor === Array) {
            let inserts = [];
            for (let hash of ledger.transactionHashes) {
                let t = await api.getTransaction(hash);
                if (t.type !== 'payment') {
                    return;
                }
                let a = t.specification.destination.address;
                let b = t.specification.source.address;
                let index = this.addresses[a] || this.addresses[b];
                if (index) {
                    let serialized = this.TransactionType.serialize(t);
                    console.log(serialized);
                    let insert = transactions.insert(serialized).catch((err) => {
                        console.log(err);
                        console.log('Error inserting Ripple transaction, skipping...');
                    });
                    inserts.push(insert);
                }
            }
            await Promise.all(inserts);
            return ledger.ledgerHash;
        }
    }

    async sendFrom(index, to, amount) {
        let kp = this.getKeyPair(index);
        let address = kp.address;

        assert(address, 'Not found');
        assert(amount, 'Amount is required');
        assert(to, 'Sending address is required');
        assert(kp.key, 'Secret key not found');

        const payment = {
            source: {
                address: address,
                maxAmount: {
                    value: amount.toString(),
                    currency: 'XRP'
                }
            },
            destination: {
                address: to,
                amount: {
                    value: amount.toString(),
                    currency: 'XRP'
                }
            }
        };

        let prepared = await api.preparePayment(address, payment);
        const {
            signedTransaction
        } = api.sign(prepared.txJSON, kp.key);
        const submitted = await api.submit(signedTransaction);
        if (submitted.resultCode !== 'tesSUCCESS') {
            console.log('Failure:', submitted);
        }
    }

    nextAvailableLedger(ledgerVersion) {
        ledgerVersion = parseInt(ledgerVersion);
        if (!ledgerVersion) return false;
        ++ledgerVersion;

        const all = this.completeLedgers;
        for (let i = 0; i < all.length; i++) {
            if (ledgerVersion < all[i][0]) {
                return all[i][0];
            }
            if (ledgerVersion > all[i][0] && ledgerVersion <= all[i][1]) {
                return ledgerVersion;
            }
        }
        throw new Error('Out of bounds');
    }

    generate(count) {
        return new Promise((resolve, reject) => {
            console.log(count, ' blocks')
            if (count <= 0) {
                return resolve();
            }
            let dir = exec("/opt/ripple/bin/rippled ledger_accept", (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                }
                console.log(stdout);
            });

            dir.on('exit', (code) => {
                return this.generate(count - 1);
            });
        })

    }
}

exports.RippleServer = RippleServer;
exports.RippleTransaction = RippleTransaction;
