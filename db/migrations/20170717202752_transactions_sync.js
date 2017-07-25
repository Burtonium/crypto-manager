const currencies = require('../currencies');
exports.up = function(knex, Promise) {
    return knex.schema.createTable('transactions_sync', (table) => {
        table.enu('currency', currencies).notNullable().unique();
        table.bigInteger('block').notNullable();
        table.binary('hash', 64);
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transactions_sync');
};
