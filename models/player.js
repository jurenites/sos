var mongoose = require('utils/mongoose');
var Schema = mongoose.Schema;
/**
 * Object Player
 */
var Player = new Schema({
    name: {
        type: String
    },
    session: {
        type: String
    }
});

Player.methods.get_name = function(){
    return this.name;
};

Player.methods.set_name = function(name){
    if(name){
        this.name = email;
        return true;
    }else{
        return false;
    }
};

Player.methods.get_session = function(){
    return this.session;
};

exports.Player = mongoose.model('Player', Player);
