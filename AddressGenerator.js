const assert = require('assert');
const fs = require('fs');
const crypto = require('crypto');
const debug = require('debug')('app:generate_addresses');
const HDPrivateKey = require('bitcore-lib').HDPrivateKey;
const bip39 = require('bip39');
const { join } = require('path');
const EventEmitter = require('events');

class AddressGenerator extends EventEmitter {
    constructor(args) {
        super();
        this.currency = args.currency;
        this.addressesPath = args.addressesPath;
        this.loadAddresses();
    }

    loadAddresses() {
        if (fs.statSync(this.addressesPath).isFile()) {
            fs.readFile(this.addressesPath, (err, data) => {
                if (err) { throw new Error('Error reading addresses file'); }
                let pairs = JSON.parse(data);
                this.addresses = pairs;
            });
        }
    }

    async generate(count, password) {
        assert(this.derive, 'Need to define a derive method to generate addresses');

        debug(`Generating ${count} ${this.currency} addresses`);

        this.addresses = this.addresses || [];
        let startingPoint = this.addresses.count || 0;

        if (startingPoint >= count) {
            return;
        }

        console.time(this.currency + ' address generation');

        for (let i = startingPoint; i < count; ++i) {
            let address = await this.derive(i);
            if (password) {
                let cipher = crypto.createCipher('aes-256', password);
                address.encrypted = cipher.update(address.key, 'utf8', 'hex');
                address.encrypted += cipher.final('hex');
            }
            this.addresses.push(address);
            this.emit('addressGenerated', {
                index: i,
                currency: this.currency,
                address
            });
        }
        
            fs.writeFileSync(this.addressesPath, JSON.stringify(this.addresses));
            return this.addresses;

    }

    static get HDPrivateKey() {
        return HDPrivateKey;
    }
}

module.exports.AddressGenerator = AddressGenerator;

module.exports.generate = async(args) => {
    const seed = bip39.mnemonicToSeed(args.mnemonic);
    const hdKey = HDPrivateKey.fromSeed(seed);
    const isDirectory = (d) => { return fs.lstatSync(d).isDirectory() };
    const isFile = (f) => { return fs.lstatSync(f).isFile() };
    const path = join(__dirname, 'servers');

    var generators = fs.readdirSync(path)
        .map((name) => { return join(path, name) })
        .filter(isDirectory)
        .map((dir) => {
            const generatorPath = join(dir, 'generator.js');
            if (fs.existsSync(generatorPath) && isFile(generatorPath)) {
                const Generator = require(join(dir, 'generator'));
                return new Generator({ hdKey });
            }
        })
        .filter((generator) => {
            return generator &&
                generator.constructor.prototype instanceof AddressGenerator;
        });
        
    if (args.currency) {
        generators = generators.filter((g) => {return g.currency === args.currency});
    }

    generators[0].addListener('addressGenerated', (e) => console.log(e));
    let tasks = generators.map((g) => { return g.generate(args.count); });
    Promise.all(tasks).then(() => { console.log('Done') });
};

const mnemonic = 'return tiger hire explain first stand embrace pear ecology weasel rain wealth';
const count = 250;
module.exports.generateAll({ mnemonic, count });
