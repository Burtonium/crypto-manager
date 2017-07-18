const HDPrivateKey  = require('bitcore-lib').HDPrivateKey;
const bip39         = require('bip39');
const basex         = require('base-x');

const words         = 'return tiger hire explain first stand embrace pear ecology weasel rain wealth';
const seed          = bip39.mnemonicToSeed(words)
const hdKey         = HDPrivateKey.fromSeed(seed);
const bip44path     = "m/44'/144'/0'/0";

function convertRippleAddr(address) {
    return basex('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz').encode(
        basex('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz').decode(address)
    )
}

function convertRipplePriv(priv) {
    return basex('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz').decode(priv).toString("hex").slice(2, 66)
}

exports.derive = function(index) {
    const path      = bip44path + '/' + index;
    const derived   = hdKey.derive(path);
    const address   = convertRippleAddr(derived.publicKey.toAddress().toString());
    const key       = convertRipplePriv(derived.privateKey.toWIF());
    
    return {
        address,
        key
    };
}
