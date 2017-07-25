const assert    = require('assert');
const KnexStore = require('./knexstore').KnexStore;

class TransactionsStore extends KnexStore {
    constructor() {
        super('transactions');
    }
    
    findWhere(criterion) {
        let query;
        if (criterion.hasOwnProperty('address')) {
            query = super.findWhere(function(){
              this.where({to: criterion.address}).orWhere({from:criterion.address})  
            });
            var newCriterion = Object.assign({}, criterion);
            delete newCriterion.address;
            query = query.andWhere(newCriterion);
        }
        return query || super.findWhere(criterion);
    }
    
    
}

module.exports = new TransactionsStore();