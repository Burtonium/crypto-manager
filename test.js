const transactions = require('./db/knexstore').create('transactions');

// console.log("2d05f0c9c3e1c226e63b5fac240137687544cf631cd616fd34fd188fc9020866".length)
// var buf = Buffer.from("8aa76677c366ea48902dfdeb1085f368eba9e22c00e4d6d608f5e150d4eb71cd", "hex");
// console.log(buf);

var suh = {
    jasJSADJjasdanj: 1,
    aksjdKJSADHNK: 2,
    dKJSDjnaksd:3 
};

for (let object of suh) {
    console.log(object);
}
(async () => {
    const t = await transactions.findAll();
    console.log(t[0].txid.toString('hex'));
    console.log(t[0].from.toString('hex'));
})()
