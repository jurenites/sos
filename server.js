/*
var express = require('express'),
    http = require('http'),
    app = express(),
    middleware = require('./middleware')(app, express),
    config = require('./config'),
    log = require('./utils/log')(app, module);

http.createServer(app).listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});

*/

/*
var User = require('./models/user');

var vasya = new User('Vasya');
var petya = new User('Petya');

vasya.sayHello(petya);
*/


var http = require('http');

var server = new http.Server();

server.listen(1337, '127.0.0.1');

var counter = 0;
server.on('request', function(req, res){
   res.end('hello world' + ++counter);
});

