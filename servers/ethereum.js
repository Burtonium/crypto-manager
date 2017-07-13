const lw = require('eth-lightwallet');
const Web3 = require('web3');
const async = require('async');
const assert = require('assert');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
assert(web3.isConnected(), 'Could not connect to geth. Did you forget --rpc when starting geth?');

const seedPhrase = 'return tiger hire explain first stand embrace pear ecology weasel rain wealth';
const bip44path = "m/44'/60'/0'/0";
const password = 'password';

lw.keystore.createVault({
    seedPhrase,
    hdPathString: bip44path,
    password
}, (err, vault) => {
    vault.keyFromPassword(password, (err, pwDerivedKey) => {
        vault.generateNewAddress(pwDerivedKey, 15);
        var addresses = vault.getAddresses();
        let balance = 0;
        console.time('balance');
        var tasks = [];
        for (let address of addresses) {
            tasks.push((callback) => {
                web3.eth.getBalance(address, (err, result) => {
                    balance += web3.fromWei(result, 'ether').toNumber();
                    callback(err);
                })
            });
        }
        async.parallel(tasks, (err) => {
            console.log(balance);
        });
        
    });
});
