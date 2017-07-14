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
}

exports.CryptoServer = CryptoServer;
