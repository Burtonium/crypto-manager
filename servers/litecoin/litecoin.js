const litecoin = require('node-litecoin');
const CryptoServer = require('../../cryptoserver').CryptoServer;
const assert = require('assert');
const addressesPath = __dirname + '/.addresses.json';
const fs = require('fs');

var client = new litecoin.Client({
    host: 'localhost',
    port: 9332,
    user: 'ltc-server',
    pass: 'TotallySecurePassword'
});

client.getBalance(function(err, balance) {
    console.log(err);
});

class LitecoinServer extends CryptoServer {
    constructor() {
        super()
    }

    async init() {
        await this.loadAddresses();
    }
    
    getAddress(index) {
        assert(this.addresses[index], 'Litecoin address not found');
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

exports.LitecoinServer = LitecoinServer;