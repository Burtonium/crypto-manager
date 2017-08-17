const express = require('express');
const app = express();
const params = require('express-params');
const port = 2121;
const bodyParser = require('body-parser');
const routes = require('./routes');
const EthereumServer = require('./servers/ethereum/ethereum').EthereumServer;
const LitecoinServer = require('./servers/litecoin/litecoin').LitecoinServer;
const RippleServer = require('./servers/ripple/ripple').RippleServer;
const CryptoServer = require('./cryptoserver').CryptoServer;
const transactions = require('./db/transactions');

const servers = {
    eth: new EthereumServer(),
    ltc: new LitecoinServer(),
    xrp: new RippleServer()
};

const currencies = Object.keys(servers);

const parallelize = async (task, args) => {
    if (args.constructor !== Array) {
        args = [args];
    }
    let response = {};
    let promises = [];
    for (let k in servers) {
        let promise = servers[k][task](...args).then((r) => {
            response[k] = r;
        });
        promises.push(promise);
    }
    await Promise.all(promises);
    return response;
}


(async() => {
    await Promise.all(Object.values(servers).map((server) => {
        return server.init();
    }));
    
    console.log(await servers.xrp.currentBlock());
    await servers.xrp.generate(3);
    console.log(await servers.xrp.currentBlock());
    
    
})().then(() => {
    
    /* Parameters */
    params.extend(app);
    app.param('index', /\d+/);
    app.param('currency', (c) => {
        return currencies.includes(c) ? c : false;
    });
    
    
    /* Routes */
    app.get('/:index', (req, res, next) => {
        const index = req.params.index;

        let response = {};
        for (var s in servers) {
            let address =  servers[s].getAddress(index);
            response[s] = {};
            if (address) {
                response[s].address = address;
            } 
        }
        if(!response)
            res.status(404).send('Index not found');
        res.json(response);
    });

    app.get('/:index/balance', async(req, res, next) => {
        const index = req.params.index;

        const response = await parallelize('getBalancesFromIndex', index);
        res.json(response);
    });

    app.get('/:index/:currency', (req, res, next) => {
        const index = req.params.index;
        const currency = req.params.currency;

        res.json({
            address: servers[currency].getAddress(index)
        });
    });
    
    app.get('/:index/:currency/balance', async (req, res, next) => {
        const index = req.params.index;
        const currency = req.params.currency;
        

        let response = await servers[currency].getBalancesFromIndex(index);

        res.json(response);
    });

    app.post('/:index/:currency/send', (req, res, next) => {
        const index = req.params.index;
        const currency = req.params.currency;
        const address = req.body.to;
        
        next();
    });

    app.get('/:index/transactions', async(req, res, next) => {
        const index = req.params.index;
 
        let response = await parallelize('getTransactions', index);
        res.json(response);
    });
    
    app.get('/:index/deposits', async(req, res, next) => {
        const index = req.params.index;
        
        let response = await parallelize('getDeposits', index);
        res.json(response);
    });
    
    app.get('/:index/withdrawals', async (req, res, next) => {
        const index = req.params.index;
        
        let response = await parallelize('getWithdrawals', index);
        res.json(response);
    });
    
    app.get('/:index/:currency/transactions', async (req, res, next) => {
        const index = req.params.index;
        const currency = req.params.currency;

        let response = await servers[currency].getTransactions(index);
        res.json(response);
    });
    
        
    app.get('/:index/:currency/withdrawals', async (req, res, next) => {
        const index = req.params.index;
        const currency = req.params.currency;

        let response = await servers[currency].getWithdrawals(index);
        res.json(response);
    });
    
        
    app.get('/:index/:currency/deposits', async (req, res, next) => {
        const index = req.params.index;
        const currency = req.params.currency;

        let response = await servers[currency].getDeposits(index);
        res.json(response);
    });
    
    if (process.env.NODE_ENV === 'development') {
        app.post('/:currency/generate/:count(\\d+)?', async (req, res, next) => {
            const currency = req.params.currency;
            const count = req.params.count || 1;
            
            let response = await servers[currency].generate(count);
            res.json({response});
        })
    } 
    
    app.get('*', function(req, res) {
        res.status(404).send({error: 'Not found'});
    });
    
    /* Error handler */
    app.use((err,req, res, next) => {
        console.log(err);
        res.status(err.status || 500).send(err.message || 'Something went wrong');
    });

    if (!module.parent) {
        app.listen(port, function(err) {
            if (err) {
                console.log(err);
            }
            console.log('running crypto server on port ' + port);
        });
    }

}).catch((err) => {
    console.log(err, '\nEncountered an error while initializing. Shutting down...');
    process.exit();
});

module.exports.app = app;
module.exports.cryptoservers = servers;