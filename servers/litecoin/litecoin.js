const assert = require('assert');
const litecoin = require('litecoin-promise');

const { CryptoServer, State } = require('../../cryptoserver');

const addressesPath = __dirname + '/.addresses.json';
const config = require('../../config');
const transactions = require("../../db/transactions");
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const bs58 = require('base-x')(BASE58);
const BigNumber = require('bignumber.js');

const serverConfig = {
    host: 'localhost',
    port: 9332,
    user: config.LTC_USER,
    pass: config.LTC_PASS
};

function toLitoshi(amount) {
    let number = new BigNumber(amount);
    return number.times(100000000).toString();
}

class LitecoinTransaction {
    constructor(args) {
        this.txid = args.txid.toString('hex');
        this.block = parseInt(args.block);
        this.created = Date.parse(args.created);
        this.from = args.from ? bs58.encode(args.from) : null;
        this.to = args.to ? bs58.encode(args.to) : null;
        this.value = new BigNumber(args.value);
        this.currency = 'ltc',
        this.fee = args.fee || null;
    }

    static serialize(args) {
        return {
            txid: Buffer.from(args.txid, 'hex'),
            block: args.height,
            created: new Date(args.time * 1000),
            from: null,
            to: bs58.decode(args.address),
            value: toLitoshi(args.value),
            currency: 'ltc',
            fee: null
        };
    }
}

class LitecoinServer extends CryptoServer {
    constructor() {
        super('ltc');
        this.TransactionType = LitecoinTransaction;
    }

    async init() {
        this.client = new litecoin.Client(serverConfig);
        await super.loadAddresses(addressesPath);
        setInterval(() => {
            this.update()
        }, 20000);
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

        /* Blockchain was reshuffled */
        if (lastSynched.hash && lastSynched.hash !== await this.getBlockHash(lastSynched.block)) {
            this.removeBlockTransactions(lastSynched.block);
            --lastSynched.block;
            lastSynched.hash = await this.getBlockHash(lastSynched.block);
            lastSynched = await this.updateSyncState(lastSynched);
        }

        let currentBlock = await this.currentBlock();
        while (lastSynched.block != currentBlock) {
            this.syncBlockTransactions(lastSynched.block + 1);
            lastSynched.block++;
            lastSynched = await this.updateSyncState(lastSynched);
            console.log('Synched Litecoin block ' + lastSynched.block + ' with the database');
            currentBlock = await this.currentBlock();
        }

        console.log('Litecoin server up to date');
        this.state = State.Idle;
    }


    currentBlock() {
        return this.client.getBlockCount();
    }

    getBlockHash(count) {
        return this.client.getBlockHash(count);
    }

    getBlockFromHash(hash) {
        if (hash.constructor === Buffer) {
            hash = hash.toString('hex');
        }

        return this.client.getBlock(hash);
    }

    getRawTransaction(txid) {
        return this.client.getRawTransaction(txid, 1);
    }

    decodeRawTransaction(hash) {
        return this.client.decodeRawTransaction(hash);
    }

    async insertMatchedTransactions(block) {
        const checkTransaction = async(err, transaction) => {
            if (err) {
                throw new Error('Transaction error:' + err);
            }

            for (let out of transaction.vout) {
                if (!out || !out.scriptPubKey || !out.scriptPubKey.addresses) {
                    continue;
                }
                let address = out.scriptPubKey.addresses[0];
                let value = out.value;
                let index = this.addresses[address];
                if (index) {
                    let args = Object.assign({
                        address,
                        value
                    }, transaction, block);
                    let t = this.TransactionType.serialize(args);
                    return transactions.insert(t).catch((err) => {
                        console.log(err);
                        console.log('Inserting transaction failed, skipping...');
                    });
                }
            }
        };
        
        let currentTransactions = await this.fetchTransactions(block.tx);
        let checks = currentTransactions.map((transaction) => {
            return checkTransaction(transaction)
        });
        return Promise.all(checks);
    }

    async fetchTransactions(txids) {
        return new Promise((resolve, reject) => {
            let batch = txids.map((txid) => {
                if (!txid) return;
                return {
                    method: 'getrawtransaction',
                    params: [txid, 1]
                }
            });

            let allTransactions = [];

            this.client.cmd(batch, (err, transaction) => {
                if (err) {
                    reject(err);
                }
                allTransactions.push(transaction);
                if (allTransactions.lengh === txids.length) {
                    resolve(allTransactions);
                }
            });

        });
    }

    async syncBlockTransactions(blockCount) {
        let hash = await this.getBlockHash(blockCount);
        let block = await this.getBlockFromHash(hash);

        if (block && block.tx) {
            return await this.insertMatchedTransactions(block);
        }
    }
}

exports.LitecoinServer = LitecoinServer;
