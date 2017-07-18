const currencies = require('../currencies');
exports.up = function(knex, Promise) {
    return knex.schema.createTable('transaction_sync', (table) => {
        table.enu('currency', currencies).notNullable().unique();
        table.bigInteger('latest_synchronized_block').notNullable();
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('transaction_sync');
};
