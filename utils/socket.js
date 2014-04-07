var log = require('utils/log')(module);
var balance = require('balance');

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

        var data = {star: balance.get('star'), planets: balance.get('planets')};
        socket.emit('server_data', data);

        /*
        socket.on('server_data', function (text, callback) {
            socket.broadcast.emit('message', text);
            callback();
        });*/
    });
};