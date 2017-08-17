const fs = require('fs');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

console.log(numCPUs);
let serversDir = __dirname + '/servers';
fs.readdir(serversDir, function(err, files){
   if (err) {
       throw new Error('An error occurred while opening the server directory: \n' + err);
   }
   
   let dirs = files.filter((file) => {return fs.lstatSync(serversDir + '/' + file).isDirectory()});
   
   dirs.forEach((dir) => {
      if (fs.exists(serversDir + '/' + dir + '/generate_addresses.js'), () => {
          
      });
   });
});