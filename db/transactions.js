const assert    = require('assert');
const KnexStore = require('./knexstore').KnexStore;
const BigNumber = require('bignumber.js');

class EthereumTransaction {
    constructor(args) {
        this.txid = '0x' + args.txid.toString('hex');
        this.block = parseInt(args.block);
        this.created = Date.parse(args.created);
        this.from = '0x' + args.from.toString('hex');
        this.to = '0x' + args.to.toString('hex');
        this.value = new BigNumber(args.value);
        this.currency = 'eth';
        this.account_id = parseInt(args.account_id);
    }
}

const types = {
    eth: EthereumTransaction
};

class TransactionsStore extends KnexStore {
    constructor() {
        super('transactions');
    }
    
    findWhere(criterion){
        let query;
        if (criterion.address) {
            console.log(criterion.address);
            query = super.findWhere(function(){
              this.where({to: criterion.address}).orWhere({from:criterion.address})  
            });
            var newCriterion = Object.assign({}, criterion);
            delete newCriterion.address;
            query = query.andWhere(newCriterion);
        }
        
        return (query || super.findWhere(criterion)).then((transactions) => {
           return new Promise((resolve) => {
               let converted = transactions.map((transaction) => {
                    assert(types[transaction.currency], transaction.currency + ' is not supported yet');
                    return new types[transaction.currency](transaction);
               });
               console.log(typeof transactions);
               resolve(converted);
           }) 
        });
    }
    
    
}

module.exports = new TransactionsStore();