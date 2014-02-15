var mongoose = require('../utils/mongoose');
var Schema = mongoose.Schema;

/**
 * Object Planet
 */
var Planet = new Schema({
    radius: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        unique: true,
        required: true
    },
    position_x: {
        type: Number,
        required: true
    },
    position_y: {
        type: Number,
        required: true
    }
});

/*
Planet.virtual('password')
    .set(function (password) {
        this._plainPassword = password;
        this.salt = Math.random() + '';
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function () {
        return this._plainPassword;
    });
*/
Planet.methods.get_name = function () {
    return this.name;
};

Planet.methods.get_radius = function () {
    return this.radius;
};

Planet.methods.get_position = function () {
    return {'x': this.position_x,'y': this.position_y};
};

exports.Planet = mongoose.model('Planet', Planet);