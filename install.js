var mongoose = require('utils/mongoose');
//mongoose.set('debug', true);
var async = require('async');
var config = require('./config');


async.series(
    [
        open,
        drop_database,
        require_models,
        create_planets,
        close,
    ],
    function(err , results){
        if (err) throw err;
        close();
        console.log(arguments);
    }
);


function open(callback){
    console.log('db open');
    mongoose.connection.on('open', callback);
}

function drop_database(callback){
    console.log('db drop');
    var db = mongoose.connection.db;
    db.dropDatabase(callback);
}

function require_models(callback){
    console.log('require models');
    require('./models/planet');
    async.each(Object.keys(mongoose.models), function(modelName, callback){
       mongoose.models[modelName].ensureIndexes(callback);
    }, callback);
}

function create_planets(callback){

    console.log('db create planets');
    async.parallel([
        function(callback){
            var planets_list = config.get_parameter('planets')
            var planets = [];
            for(key in planets_list){
                if(planets_list[key]['radius']){
                    planets.push(planets_list[key]);
                }
            }

            async.each(planets, function(item, callback){
                 var planet = new mongoose.models.Planet(item);
                planet.save(callback);
            }, callback);
            /*
             planet.save(function(err, planet, affected){
             console.log(affected);
             if (err) throw err;
             });
             */
        }
    ], callback);
}

function close(callback){
    console.log('db disconnect');
    mongoose.disconnect(callback);
}