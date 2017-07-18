const HDPrivateKey = require('litecore-lib').HDPrivateKey;
const bip39        = require('bip39');

var words   = 'return tiger hire explain first stand embrace pear ecology weasel rain wealth';
var seed    = bip39.mnemonicToSeed(words)
var hdKey   = HDPrivateKey.fromSeed(seed);
var bip44path = "m/44'/2'/0'/0";

exports.derive = function(index) {
    let path = bip44path + '/' + index;
    let derived = hdKey.derive(path);
    return {
        address: hdKey.derive(path).publicKey.toAddress().toString(),
        key: derived.privateKey.toWIF()
    };
}