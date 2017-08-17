// This seeds the server with the current block of every chain

const { servers } = require('../app');

let currentBlocks = servers.map( async (s) => {
  let block = await s.currentBlock();
  return {currency: s.currency, block };
});

console.log(currentBlocks);
exports.seed = async(knex) => {

  return knex('transactions_sync').del()
    .then(() => {
      // Inserts seed entries
      return knex('table_name').insert(currentBlocks);
    });
};
