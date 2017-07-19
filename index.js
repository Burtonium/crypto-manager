const express = require('express');
const app = express();
const port = 2121;
const bodyParser = require('body-parser');
const routes = require('./routes');
const EthereumServer = require('./servers/ethereum/ethereum').EthereumServer;
const LitecoinServer = require('./servers/litecoin/litecoin').LitecoinServer;
const RippleServer = require('./servers/ripple/ripple').RippleServer;
const transactions = require('./db/transactions');

const servers = {
    eth: new EthereumServer(),
    ltc: new LitecoinServer(),
    xrp: new RippleServer()
};

const currencies = Object.keys(servers);

( async () => {
    await Promise.all(Object.values(servers).map((server) => {
        return server.init();
    }));
    
    console.log(await servers.eth.getBalancesFromIndex(8));
    
})().then(() => {
    
    const parseIndex = (index, next) => {
        if (!index.match(/^\d+$/)) {
            next();
        }
        return parseInt(index);
    }
    
    const parseCurrency = (currency, next) => {
        if (!servers[currency]) next();
        return currency;
    }
    
    app.get('/:index', (req, res, next) => {
        const index = parseIndex(req.params.index, next);
        var response = {};
        for (var s in servers) {
            response[s] = {};
            response[s].address = servers[s].getAddress(index);
        }
        res.json(response);
    });

    app.get('/:id/:currency', (req, res, next) => {
        const id = req.params.id;
        const currency = req.params.currency;
        if (!servers[currency]) {
            next();
        }
        else {
            res.json({address: servers[currency].getAddress(id)});
        }
    });
    
    app.post('/:id/:currency/send', (req,res, next) => {
        const id = parseIndex(req.params.id, next);
        const currency = req.params.currency; 
        const address = req.params.address || req.params.to;
        
        if (!servers[currency]) {
            next();
        }
        else {
            
        }
    });
    
    app.get('/:id/transactions', async (req, res, next) => {
        const id = parseIndex(req.params.id, next);
        servers.map((server) => {
            return server.getTransactions(id);
        })
        res.json({});
    });
    
    app.get(':id/:currency/transactions', (req, res) => {
        
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

module.exports = app;
