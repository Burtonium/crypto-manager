const RippleAPI = require('ripple-lib').RippleAPI;
const api = new RippleAPI({server: 'ws://localhost:6006'});
const CryptoServer = require('../../cryptoserver').CryptoServer;
const addressesPath = __dirname + '/.addresses.json';

class RippleServer extends CryptoServer {
    constructor() {
        super('xrp');
    }
    
    async init() {
        await Promise.all([api.connect(), super.loadAddresses(addressesPath)]);
    }
    
    getAddressBuffer(index) {
        return "";
    }
}

exports.RippleServer = RippleServer;