/**
 * on load page
 */
document.addEventListener('DOMContentLoaded',function(){

    // connection to the server via socked
    var socket = io.connect('',{'reconnect': false});
    socket

        .on('message', function (message) {
            if(typeof message != 'undefined'){
                console.log('message:'+message);
            }
            //socket.emit('my other event', { my: 'data' });
        })
        .on('server_data', function(data){
            init.draw.solar_system_objects(data);
        })
        .on('connect', function(){
            console.log('socket connect');

            if(typeof Stats != 'undefined'){
                stats = new Stats();
                stats.setMode(0);
                stats.domElement.style.position = 'absolute';
                stats.domElement.style.right = '0px';
                stats.domElement.style.top = '0px';

                document.body.appendChild( stats.domElement );

            }
            init.start(DOM_OBJ_ID);
        })
        .on('disconnect', function(){
            console.log('socket disconnect');
            setTimeout(reconnect,500)
        });
    /**
     *
     */
    function reconnect(){
        socket.once('error', function(){
            setTimeout(reconnect, 500);
        });
        socket.socket.connect();

    }
});