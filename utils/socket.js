var log = require('utils/log')(module);

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
    });
};