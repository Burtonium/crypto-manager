const fs = require('fs');
const Web3 = require('web3');
const CryptoServer = require('../../cryptoserver').CryptoServer;
const assert = require('assert');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const addressesPath = __dirname + '/.addresses.json';

assert(web3.isConnected(), 'Could not connect to geth. Did you forget --rpc when starting geth?');

class EthereumServer extends CryptoServer {
    constructor() {
        super();
    }

    async init() {
        await this.loadAddresses();
    }

    getAddress(index) {
        assert(this.addresses[index], 'Ethereum address not found');
        return this.addresses[index].address;
    }

    loadAddresses() {
        return new Promise((resolve, reject) => {
            assert(fs.existsSync(addressesPath), '.addresses.json for Ethereum not found. Run generate_addresses first');
            fs.readFile(addressesPath, (err, data) => {
                if (err) {
                    reject(err);
                }
                try {
                    this.addresses = JSON.parse(data);
                    assert(this.addresses.length, 'No Ethereum addresses found.')
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            })
        })
    }

}

exports.EthereumServer = EthereumServer;

// lw.keystore.createVault({
//     seedPhrase,
//     hdPathString: bip44path,
//     password
// }, (err, vault) => {
//     vault.keyFromPassword(password, (err, pwDerivedKey) => {
//         vault.generateNewAddress(pwDerivedKey, 15);
//         var addresses = vault.getAddresses();
//         let balance = 0;
//         console.time('balance');
//         var tasks = [];
//         for (let address of addresses) {
//             tasks.push((callback) => {
//                 web3.eth.getBalance(address, (err, result) => {
//                     balance += web3.fromWei(result, 'ether').toNumber();
//                     callback(err);
//                 })
//             });
//         }
//         async.parallel(tasks, (err) => {
//             console.log(balance);
//         });

//     });
// });
