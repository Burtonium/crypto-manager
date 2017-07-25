const currencies = require('../currencies');
exports.up = function(knex, Promise) {
    return knex.schema.createTable('transactions', (table) => {
        table.binary('txid', 64).primary();
        table.bigInteger('block').index();
        table.timestamp('created').notNullable().index();
        table.binary('from', 64).index();
        table.binary('to', 64).notNullable().index();
        table.bigInteger('value').notNullable().index();
        table.bigInteger('fee').index();
        table.enu('currency', currencies).notNullable().index();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transactions');
};
