var express = require('express');
var http = require('http');
var path = require('path');
var config = require('./config');
var log = require('utils/log')(module);
var async = require('async');
var mongoose = require('utils/mongoose');
var session_store = require('utils/session_store');
var User = require('models/user').User;

var app = express();

/**
 * main bootstrap client application
 **/
app.use(express.favicon('public/images/favicon.ico'));

app.use(express.logger( (app.get('env') == 'development') ? 'dev' :'default'));

app.use(express.bodyParser());

app.use(express.cookieParser('your secret here'));

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
            //res.end();
            //res.send('ok');
        });
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(err, req, res, next){
   if(app.get('env') == 'development') {
       var errorHandler = express.errorHandler();
       errorHandler(err, req, res, next);
   }else{
       res.send(500);
   }
});

http.createServer(app).listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});