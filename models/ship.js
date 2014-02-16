var mongoose = require('utils/mongoose');
var Schema = mongoose.Schema;
/**
 * Object Ship
 */
var Ship = new Schema({
    position_x:{
        type: Number,
        required: true
    },
    position_y:{
        type: Number,
        required: true
    },
    session: {
        type: String
    }
});

Ship.methods.get_session = function(){
    return this.session;
};

exports.Ship = mongoose.model('Ship', Ship);
