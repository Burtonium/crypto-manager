const MoneroWallet = require('monero-nodejs');

var wallet = new MoneroWallet();

wallet.balance().then(function(balance) {
    console.log(balance);
});