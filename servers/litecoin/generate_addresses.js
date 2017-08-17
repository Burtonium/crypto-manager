const debug = require('debug')('app:generate_addresses');
const lib = require('./lib');
const fs = require('fs');
const writePath = __dirname + '/.addresses.json';
const count = process.env.ADDRESSES_TO_GENERATE || 200; // how many addresses to watch

console.log('Generating ' + count + ' ethereum addresses');

var addresses = [];
addresses.length = count;

if (fs.existsSync(writePath)) {
    throw new Error('Cannot overwrite old addresses');
}

console.time('Litecoin address generation');

for (var i = 0; i < count; ++i) {
    addresses[i] = lib.derive(i);
}

fs.writeFileSync(writePath, JSON.stringify(addresses));

console.timeEnd('Litecoin address generation');