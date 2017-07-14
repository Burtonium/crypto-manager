const express = require('express');
const app = express();
const port = 2121;
const bodyParser = require('body-parser');
const routes = require('./routes');
const EthereumServer = require('./servers/ethereum/ethereum').EthereumServer;
const LitecoinServer = require('./servers/litecoin/litecoin').LitecoinServer;

const eth = new EthereumServer();
const ltc = new LitecoinServer();

( async () => {
    await eth.init();
    await ltc.init();
})().then(() => {

    app.get('/:id', function(req, res) {
        let id = req.params.id;
        res.json({
            eth: eth.getAddress(id),
            ltc: ltc.getAddress(id)
        });
    });

    if (!module.parent) {
        app.listen(port, function(err) {
            if (err) {
                console.log(err);
            }
            console.log('running crypto server on port ' + port);
        });
    }

});

module.exports = app;
