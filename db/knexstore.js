const Knex = require('knex');
const config = require('./config');
const knex = Knex(config);
const assert = require('assert');

class KnexStore {
    constructor(table) {
        assert(table, 'Table name required.');
        this.table = table;
    }

    findAll() {
        return knex(this.table).select();
    }

    findWhere(criterion) {
        return knex(this.table).where(criterion);
    }

    findOne(criterion) {
        if (!criterion) {
            return this.findAll().first();
        }
        return knex(this.table).where(criterion).first();
    }

    deleteWhere(criterion) {
        return knex(this.table).where(criterion).del();
    }

    insert(object) {
        return knex(this.table).insert(object).returning('*');
    }

    update(object, criterion) {
        if (!criterion) {
            criterion = {
                id: object.id
            };
        }
        return knex(this.table).where(criterion).update(object).returning('*');
    }
}

module.exports = function(table) {
    return new KnexStore(table);
};
