const Web3 = require('web3');
const { CryptoServer, State} = require('../../cryptoserver');
const assert = require('assert');
const addressesPath = __dirname + '/.addresses.json';
const debug = require('debug')('app:ethereum_server');
const transactions = require("../../db/transactions");
const BigNumber = require('bignumber.js');

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
assert(web3.isConnected(), 'Could not connect to geth. Did you forget --rpc when starting geth?');

class EthereumTransaction {
    constructor(args) {
        this.txid = '0x' + args.txid.toString('hex');
        this.block = parseInt(args.block);
        this.created = Date.parse(args.created);
        this.from = '0x' + args.from.toString('hex');
        this.to = '0x' + args.to.toString('hex');
        this.value = new BigNumber(args.value);
        this.currency = 'eth';
        this.fee = args.fee;
    }

    static serialize(args) {
        return {
            txid: Buffer.from(args.hash.substring(2), 'hex'),
            block: args.blockNumber,
            created: new Date(args.timestamp * 1000),
            from: Buffer.from(args.from.substring(2), 'hex'),
            to: Buffer.from(args.to.substring(2), 'hex'),
            value: args.value.toString(),
            currency: 'eth',
            fee: args.gasPrice.times(args.gas).toString()
        }
    }
}

class EthereumServer extends CryptoServer {
    constructor() {
        super('eth');
        super.TransactionType = EthereumTransaction;
    }

    async init() {
        this.loadAddresses(addressesPath);
        this.setupBlockWatcher();
        this.state = State.Idle;
    }

    async loadAddresses() {
        await super.loadAddresses(addressesPath);

        /* Ethereum addresses are not case sensitive */
        this._keyPairs.map((kp, i) => {
            this._addresses[kp.address.toLowerCase()] = i;
        });
    }

    update() {
        if (this.state !== State.Syncing) {
            this.syncToDb();
        }
    }

    async syncToDb() {
        this.state = State.Syncing;
        try {
            let lastSynched = await this.getSyncState();
            let currentBlock = await this.currentBlock();
            while (lastSynched.block != currentBlock) {
                let block = await this.getBlock(lastSynched.block + 1);

                if (block && block.transactions) {
                    let inserts = [];
                    block.transactions.map((t) => {
                        const index = this.addresses[t.from] || this.addresses[t.to];

                        if (index) {
                            let args = Object.assign({
                                timestamp: block.timestamp
                            }, t);
                            let transaction = this.TransactionType.serialize(args);
                            let insert = transactions.insert(transaction);
                            inserts.push(insert);
                        }
                    });
                    Promise.all(inserts).catch((err) => {
                        console.log(err);
                        console.log('Inserting transaction failed, skipping...');
                    });
                }
                lastSynched.block++;
                lastSynched = await this.updateSyncState(lastSynched);
                console.log('Synched Ethereum block ' + lastSynched.block + ' with the database');
                currentBlock = await this.currentBlock();
            }
            console.log('Ethereum server up to date.');
            this.state = State.Idle;
        }
        catch (err) {
            console.log(err);
            this.state = State.Idle;
        }
    }


    async getBlock(block) {
        return new Promise((resolve, reject) => {
            web3.eth.getBlock(block, true, (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        });
    }

    getAddressBuffer(index) {
        return Buffer.from(super.getAddress(index).substring(2), 'hex');
    }

    getBalancesFromIndex(index) {
        return super.getBalances(this.getAddressBuffer(index));
    }

    currentBlock() {
        return new Promise((resolve, reject) => {
            web3.eth.getBlockNumber((err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            })
        });
    }

    setupBlockWatcher() {
        web3.eth.filter('latest').watch((err, result) => {
            if (err) {
                console.log(err);
            }
            else {
                var block = web3.eth.getBlock(result, true);
                this.update();
                console.log('Ethereum block changed: ', block.number);
            }
        });
    }

    getTransactions(index) {
        const address = this.getAddressBuffer(index);
        return super.findTransactions({
            address
        });
    }

    getDeposits(index) {
        const address = this.getAddressBuffer(index);
        return super.findTransactions({
            to: address
        });
    }

    getWithdrawals(index) {
        const address = this.getAddressBuffer(index);
        return super.findTransactions({
            from: address
        });
    }

}

exports.EthereumServer = EthereumServer;
