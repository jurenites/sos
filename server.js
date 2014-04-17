var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var config = require('config');
var log = require('utils/log')(module);
var async = require('async');
var mongoose = require('utils/mongoose');
var session_store = require('utils/session_store');
var User = require('models/user').User;

var app = express();

/**
 * Main bootstrap client application
 **/

app.use(express.favicon('public/images/favicon.ico'));

app.use(express.logger( (app.get('env') == 'development') ? 'dev' :'default'));

//app.use(express.bodyParser());
app.use(express.json());
app.use(express.urlencoded());

app.use(express.cookieParser(config.get('session:secret')));

app.use(express.session({
    secret: config.get('session:secret'),
    key: config.get('session:key'),
    cookie: config.get('session:cookie'),
    //maxAge  : new Date(Date.now() + config.get('session:expires')),
    //expires : new Date(Date.now() + config.get('session:expires')),
    store: session_store
}));

app.get('/', function(req, res, next){
    async.waterfall(
        [
            function(callback){
                User.get_by_session(req.session.user_session_id, callback);
            },
            function(user, callback){
                if(user){
                    console.log('old sess: ' + user.get_session());
                }
                else{
                    var user = new User();
                    user.set_session();
                    console.log('new sess: ' + user.get_session());
                    user.save( function(err){
                        if (err) return next(err);
                        req.session.user_session_id = user.get_session();
                        callback(null, user);
                    });
                }
            }
        ],
        function(err, user){
            if(err) return next(err);
            //res.send('ok');        sdfsdf
            //res.end();
        });

    fs.readFile('public/index.html', function (err, html) {
    if (err) { throw err; }
    res.writeHeader(200, {"Content-Type": "text/html"});
    res.write(html);
    res.end();
    });
    //next();
    //res.sendfile(__dirname + '/public/index.html');
    //res.end();
});

app.use(express.static( path.join(__dirname, 'public')));

app.use(function(err, req, res, next){
    log.err(err);
    if(app.get('env') == 'development') {
        var errorHandler = express.errorHandler();
        errorHandler(err, req, res, next);
    }else{
        res.send(500);
    }
});

//cerate web(http) server
var server = http.createServer(app);
server.listen(config.get('port'), function(){
    log.info('HTTP server listening on port ' + config.get('port'));
});

//cerate game(tcp) socket server
require('utils/socket')(server);

//cerate game(udp) server
/*
var PORT = 33333;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var server_2 = dgram.createSocket('udp4');

server_2.on('listening', function () {
    var address = server_2.address();
    log.info('UDP server listening on '+ address.address + ":" + address.port);
});

server_2.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);

});

server_2.bind(PORT, HOST);
*/
//create client(udp)
/*
 var PORT = 33333;
 var HOST = '127.0.0.1';

 var dgram = require('dgram');
 var message = new Buffer('My KungFu is Good!');

 var client = dgram.createSocket('udp4');
 client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
 if (err) throw err;
 console.log('UDP message sent to ' + HOST +':'+ PORT);
 client.close();
 });
*/