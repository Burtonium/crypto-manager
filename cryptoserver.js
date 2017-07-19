const assert = require('assert');
const fs = require('fs');
const Knex = require('knex');
const config = require('./db/config');
const knex = Knex(config);

class CryptoServer {
    constructor(currency) {
        assert(currency);
        this.currency = currency;
        

        if (new.target === CryptoServer) {
            throw new TypeError("Cannot instantiate an abstract class");
        }
        
        const abstractMethods = [];
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
    
    getBalancesFromIndex(index) {
        return this.getBalances(this.getAddress(index));
    }
    
    async getBalances(address) {
        /* TODO: clean this mess */
        try { 
            const query = await knex.raw(`
                SELECT deposits, withdrawals, fees, deposits - withdrawals - fees as balance FROM (
                    SELECT (SELECT COALESCE(SUM(value), 0) FROM transactions t WHERE t.to = ?) as deposits,
                           (SELECT COALESCE(SUM(value), 0) FROM transactions t WHERE t.from = ?) as withdrawals,
                           (SELECT COALESCE(SUM(fee), 0) FROM transactions t WHERE t.from = ?) as fees
                        ) as subquery`, [address, address, address]);
            
            assert(query.rows[0], 'Something went wrong');
            return query.rows[0];
        }
        catch(err) {
            console.log(err);
        }
    }
}


exports.CryptoServer = CryptoServer;
