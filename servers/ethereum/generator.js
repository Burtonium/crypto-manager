const AddressGenerator = require('../../AddressGenerator').AddressGenerator;
const assert = require('assert');
const bip44path = "m/44'/60'/0'/0";
const { join } = require('path');
const ethUtils      = require('ethereumjs-util');

class EthereumAddressGenerator extends AddressGenerator {
    constructor(args) {
        const additional = {
            addressesPath: join(__dirname, '.addresses.json'), 
            currency: 'ethereum'
        };
        super(Object.assign(args, additional));
        this.derivationPath = args.derivationPath || bip44path;
        this.hdKey = args.hdKey;
        super.derive = this.derive;
    }
    
    async derive(index) {
        console.log('started');
        let path = join(this.derivationPath, index.toString());
        let derivedKey = this.hdKey.derive(path);
        let privKeyBuffer = derivedKey.privateKey.toBuffer();
        let key = privKeyBuffer.toString('hex');
        let addressBuffer = ethUtils.privateToAddress(privKeyBuffer);
        let hexAddress = addressBuffer.toString('hex');
        let address = ethUtils.toChecksumAddress(hexAddress);
        console.log('ended');
        return {address, key};
    }
}

module.exports = EthereumAddressGenerator;