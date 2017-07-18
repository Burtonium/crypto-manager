'use strict';
const Web3 = require('web3');
const CryptoServer = require('../../cryptoserver').CryptoServer;
const assert = require('assert');
const addressesPath = __dirname + '/.addresses.json';
const debug = require('debug')('app:ethereum_server');
const KnexStore = require('../../db/knexstore');
const transactionStore = new KnexStore('transactions');
const syncStates = new KnexStore('transaction_sync');

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
assert(web3.isConnected(), 'Could not connect to geth. Did you forget --rpc when starting geth?');

class EthereumServer extends CryptoServer {
    constructor() {
        super();
    }

    async init() {
        this.loadAddresses(addressesPath);
        
        this.setupBlockWatcher();
    }
    
    async loadAddresses() {
        await super.loadAddresses(addressesPath);
        
        /* Ethereum addresses are not case sensitive */
        this._keyPairs.map((kp, i) => {
            this._addresses[kp.address.toLowerCase()] = i;
        });
    }

    async update() {

        let lastSynched = await syncStates.findOne({
            currency: 'eth'
        });

        if (typeof lastSynched === 'undefined') {
            lastSynched = await syncStates.insert({
                currency: 'eth',
                latest_synchronized_block: -1
            });
        }
        assert(lastSynched, 'Couldn\'t fetch last synched block');

        let lastBlock = parseInt(lastSynched.latest_synchronized_block);
        while (lastBlock != await this.currentBlock()) {
            let block = await this.getTransactions(lastBlock + 1);
            
            if (block !== null && block.transactions !== null) {
                let inserts = [];
                block.transactions.map((t) => {

                    let index = this.addresses[t.from] ||
                                this.addresses[t.to];
                    
                    if (index) {
                        let insert = transactionStore.insert({
                            txid: Buffer.from(t.hash.substring(2), 'hex'),
                            block: t.blockNumber,
                            created: new Date(block.timestamp * 1000),
                            from: Buffer.from(t.from.substring(2), 'hex'),
                            to: Buffer.from(t.to.substring(2), 'hex'),
                            value: t.value.toString(),
                            currency: 'eth',
                            user_id: index
                        });
                        inserts.push(insert);
                    }
                });
                Promise.all(inserts).catch((err) => {
                    console.log(err);
                    console.log('Inserting transaction failed, skipping...');
                });
            }
            
            lastSynched.latest_synchronized_block++;
            let updated = await syncStates.update(lastSynched, {currency: 'eth'});
            assert(updated.length, 'Unable to sync to block:' + (lastBlock + 1));
            lastSynched = updated[0];
            lastBlock = parseInt(lastSynched.latest_synchronized_block);
            console.log('Synched Ethereum block ' + lastBlock + ' with the database');
        }
        console.log('Ethereum server up to date.');
    }

    async getTransactions(block) {
        return new Promise((resolve, reject) => {
            web3.eth.getBlock(block, true, (err, result) => {
                if(err) {reject(err);}
                resolve(result);
            });
        });
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

    syncBlock(block) {

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
}

exports.EthereumServer = EthereumServer;
