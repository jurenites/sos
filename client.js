var express = require('express');
var http = require('http');
var path = require('path');
var config = require('./config');
var log = require('utils/log')(module);

var app = express();

/**
 * Favicon
 * */
app.use(express.favicon('public/images/favicon.ico'));

if(app.get('env') == 'development'){
    app.use(express.logger('dev'));
}else{
    app.use(express.logger('default'));
}
app.use(express.bodyParser()); //req.body
app.use(express.cookieParser('your secret here')); //req.cookies
app.use(app.router);

app.get('/', function(req, res, next){
    res.end('test');
});
app.use(express.static(path.join(__dirname, 'public')));


http.createServer(app).listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});

/*

var routes = require('./routes');
var user = require('./routes/user');




// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {

}

app.get('/', routes.index);
app.get('/users', user.list);
*/