const litecoin = require('node-litecoin');

var client = new litecoin.Client({
    host: 'localhost',
    port: 9332,
    user: 'ltc-server',
    pass: 'TotallySecurePassword'
});

client.getBalance(function(err, balance){
    console.log(err);
});