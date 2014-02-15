var nconf = require('nconf');
var path = require('path');
var parameter = require('./balance.json');

nconf.argv()
    .env()
    .file({file: path.join(__dirname, 'config.json')});

nconf.get_parameter = function(name){
    if(!parameter[name]){
        throw new Error('No parameter' + name);
    }
    return parameter[name];
}

module.exports = nconf;