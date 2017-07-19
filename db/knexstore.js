const Knex = require('knex');
const config = require('./config');
const knex = Knex(config);
const assert = require('assert');

class KnexStore {
    constructor(table) {
        assert(table, 'Table name required.');
        this._knex = knex;
        this.knex = () => {return this._knex(table)};
    }

    findAll() {
        return this.knex().select();
    }

    findWhere(criterion) {
        return this.knex().where(criterion);
    }

    findOne(criterion) {
        if (!criterion) {
            return this.findAll().first();
        }
        return this.knex().where(criterion).first();
    }

    deleteWhere(criterion) {
        return this.knex().where(criterion).del();
    }

    insert(object) {
        return this.knex().insert(object).returning('*');
    }

    update(object, criterion) {
        if (!criterion) {
            criterion = {
                id: object.id
            };
        }
        return this.knex().where(criterion).update(object).returning('*');
    }
    
}

module.exports.create = function(table) {
    return new KnexStore(table);
};

module.exports.KnexStore = KnexStore;
