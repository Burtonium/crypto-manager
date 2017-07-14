const RippleAPI = require('ripple-lib').RippleAPI;
const api = new RippleAPI({server: 'ws://localhost:6006'});

api.connect().then(() => {
   api.getServerInfo().then((info) => {
       console.log(info);
   });
}, (err) => {
    console.log(err);
});
