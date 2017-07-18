const litecoin = require('node-litecoin');
const CryptoServer = require('../../cryptoserver').CryptoServer;
const addressesPath = __dirname + '/.addresses.json';
const config = require('../../config');

const serverConfig = {
    host: 'localhost',
    port: 9332,
    user: config.LTC_USER,
    pass: config.LTC_PASS
};

class LitecoinServer extends CryptoServer {
    constructor() {
        super();
    }

    async init() {
        this.client = new litecoin.Client(serverConfig);
        await super.loadAddresses(addressesPath);
    }
}

exports.LitecoinServer = LitecoinServer;