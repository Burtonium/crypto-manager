const express = require('express');
const app = express();
const port = 2121;
const bodyParser = require('body-parser');
const routes = require('./routes');
const EthereumServer = require('./servers/ethereum/ethereum').EthereumServer;
const LitecoinServer = require('./servers/litecoin/litecoin').LitecoinServer;
const RippleServer = require('./servers/ripple/ripple').RippleServer;

const servers = {
    eth: new EthereumServer(),
    ltc: new LitecoinServer(),
    xrp: new RippleServer()
};

(async() => {
    await Promise.all(Object.values(servers).map((server) => {
        return server.init();
    }));
    servers.eth.update();
})().then(() => {

    app.get('/:id', function(req, res) {
        let id = req.params.id;
        var response = {};
        for (var s in servers) {
            response[s] = {};
            response[s].address = servers[s].getAddress(id);
        }
        res.json(response);
    });

    app.get('/:id/:currency', function(req, res, next) {
        const id = req.params.id;
        const currency = req.params.currency;
        if (!servers[currency]) {
            next();
        }
        else {
            res.json({address: servers[currency].getAddress(id)});
        }
    });
    
    app.get('/:id/balance', function(req, res){
        
    });
    
    app.post('/:id/:currency/send', function(req,res, next){
        const id = req.params.id;
        const currency = req.params.currency; 
        const address = req.params.address || req.params.to;
        
        if (!servers[currency]) {
            next();
        }
        else {
            
        }
    });
    
    app.get(':id/transactions', function(req, res){
        
    });
    
    app.get(':id/:currency/transactions', function(req, res){
        
    });
    
    app.get('/:id:')

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
