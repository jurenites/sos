var nconf = require('nconf');
var path = require('path');
var parameter = require('./balance');

nconf.argv()
    .env()
    .file({file: path.join(__dirname, 'config.json')});

module.exports = nconf;

exports.get_parameter = function(name){
    if(!parameter[name]){
        throw new Error('No parameter' + name);
    }
    return parameter[name];
}