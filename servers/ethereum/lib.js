const HDPrivateKey  = require('bitcore-lib').HDPrivateKey;
const bip39         = require('bip39');
const ethUtils      = require('ethereumjs-util');

const words = 'return tiger hire explain first stand embrace pear ecology weasel rain wealth';
const bip44path = "m/44'/60'/0'/0";
const seed  = bip39.mnemonicToSeed(words);
const privKey = HDPrivateKey.fromSeed(seed);

exports.derive = function(index) {
    let path = bip44path + '/' + index;
    let derivedKey = privKey.derive(path);
    let privKeyBuffer = derivedKey.privateKey.toBuffer();
    let key = privKeyBuffer.toString('hex');
    let addressBuffer = ethUtils.privateToAddress(privKeyBuffer);
    let hexAddress = addressBuffer.toString('hex');
    let address = ethUtils.toChecksumAddress(hexAddress);
    return {address, key};
};
