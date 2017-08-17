const assert = require('assert');
const fs = require('fs');
const Knex = require('knex');
const config = require('./db/config');
const knex = Knex(config);
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const bs58 = require('base-x')(BASE58);
const transactions = require("./db/transactions");
const KnexStore = require('./db/knexstore').KnexStore;
const syncStates = new KnexStore('transactions_sync');
const Enum = require('enum');

class Transaction {
    constructor(args) {
        Object.assign(this, args);
    }

    static serialize(args) {
        return args;
    }
}

const State = new Enum(['Uninitialized', 'Idle', 'Syncing']);

class CryptoServer {
    constructor(currency) {
        if (new.target === CryptoServer) {
            throw new TypeError("Cannot instantiate an abstract class");
        }
        assert(currency);
        this.currency = currency;
        this.TransactionType = Transaction;
        this.state = State.Uninitialized;

        // const abstractMethods = [];
        // for (let method of abstractMethods) {
        //     if (this[method] === undefined) {
        //         throw new TypeError(method + " must be overriden");
        //     }
        // }
    }

    loadAddresses(path) {
        return new Promise((resolve, reject) => {
            assert(fs.existsSync(path), '.addresses.json for not found. Run generate_addresses first');
            fs.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                }
                try {
                    this._keyPairs = JSON.parse(data);
                    this._addresses = {};
                    this._keyPairs.map((kp, i) => {
                        this._addresses[kp.address] = i;
                    });

                    assert(this._keyPairs.length, 'No addresses found.')
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            })
        })
    }

    getAddress(index) {
        let pair = this._keyPairs[index];
        return pair ? pair.address : undefined;
    }

    getAddressBuffer(index) {
        let kp = this._keyPairs[index];
        if (!kp) return new Buffer("");
        return bs58.decode(kp.address);
    }

    get addresses() {
        return this._addresses;
    }
    
    getKeyPair(index) {
        return this._keyPairs[index];
    }

    getBalancesFromIndex(index) {
        return this.getBalances(this.getAddressBuffer(index));
    }

    async getBalances(address) {
        /* TODO: clean this mess */
        try {
            const query = await knex.raw(`
                SELECT deposits, withdrawals, fees, deposits - withdrawals - fees as balance FROM (
                    SELECT (SELECT COALESCE(SUM(value), 0) FROM transactions t WHERE t.to = ?) as deposits,
                           (SELECT COALESCE(SUM(value), 0) FROM transactions t WHERE t.from = ?) as withdrawals,
                           (SELECT COALESCE(SUM(fee), 0) FROM transactions t WHERE t.from = ?) as fees
                        ) as subquery`, [address, address, address]);

            assert(query.rows[0], 'Something went wrong');
            return query.rows[0];
        }
        catch (err) {
            console.log(err);

        }
    }
    
    async currentBlock() {
        return 0;
    }
    
    findTransactions(criterion) {
        return transactions.findWhere(criterion).then( async (transactions) => {
            let currentBlock = await this.currentBlock();
            return transactions.map((transaction) => {
                let t = new this.TransactionType(transaction);
                t.confirmations = currentBlock - t.block;
                return t;
            });
        });
    }

    getTransactions(index) {
        const address = this.getAddressBuffer(index);
        return this.findTransactions({
            address
        });
    }

    getDeposits(index) {
        const address = this.getAddressBuffer(index);
        return this.findTransactions({
            to: address
        });
    }

    getWithdrawals(index) {
        const address = this.getAddressBuffer(index);
        return this.findTransactions({
            from: address
        });
    }
    
    removeBlockTransactions(block) {
        transactions.deleteWhere({
            block,
            currency: this.currency
        });
    }

    async getSyncState(syncStateIfNotFound) {
        let state = await syncStates.findOne({
            currency: this.currency
        });
        
        if (typeof state === 'undefined') {
            state = await syncStates.insert(syncStateIfNotFound || {
                currency: this.currency,
                block: -1
            });
        }
        state.block = parseInt(state.block);
        return state;
    }

    async updateSyncState(syncState) {
        assert(Number.isInteger(syncState.block), 'Block number not a number');
        let updated = await syncStates.update(syncState, {currency: this.currency});
        assert(updated.length, 'Unable to sync to block:');
        updated[0].block = parseInt(updated[0].block);
        return updated[0];
    }
    
    get state() {
        return this._state;
    }
    
    set state(state) {
        this._state = state;
    }
    
    get currency() {
        return this._currency;
    }
    
    set currency(c) {
        this._currency = c;
    }
}

exports.CryptoServer = CryptoServer;
exports.State = State;
