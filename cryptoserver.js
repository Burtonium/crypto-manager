const assert = require('assert');
const fs = require('fs');

class CryptoServer {
    constructor() {
        const abstractMethods = ['getAddress'];
        if (new.target === CryptoServer) {
            throw new TypeError("Cannot instantiate an abstract class");
        }
        for (let method of abstractMethods) {
            if (this[method] === undefined) {
                throw new TypeError(method + " must be overriden");
            }
        }
    }

    loadAddresses(path) {
        return new Promise((resolve, reject) => {
            assert(fs.existsSync(path), '.addresses.json for not found. Run generate_addresses first');
            fs.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                }
                try {
                    this._keyPairs = JSON.parse(data);
                    this._addresses = {};
                    this._keyPairs.map((kp, i) => {
                        this._addresses[kp.address] = i;
                    });

                    assert(this._keyPairs.length, 'No addresses found.')
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            })
        })
    }

    getAddress(index) {
        assert(this._keyPairs[index], 'address not found');
        return this._keyPairs[index].address;
    }

    get addresses() {
        return this._addresses;
    }
}


exports.CryptoServer = CryptoServer;
