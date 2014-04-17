var log = require('utils/log')(module);
//var balance = require('balance');
var config = require('config');

module.exports = function(server){
    var io = require('socket.io').listen(server);
    io.set('origins', 'sos.dev:*');
    io.set('logger', log);

    io.sockets.on('connection', function (socket) {

        //socket.emit('news', { hello: 'world' });

        socket.on('message', function (text, callback) {
            socket.broadcast.emit('message', text);
            callback();
        });
        var data = {star: config.get_parameter('star'), planets: config.get_parameter('planets')};
        socket.emit('server_data', data);

        /*
        socket.on('server_data', function (text, callback) {
            socket.broadcast.emit('message', text);
            callback();
        });*/
    });
};