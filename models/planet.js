var mongoose = require('../utils/mongoose');,
var Schema = mongoose.Schema;
    //async = require('async');
/**
 * Object Planet
 */
var Planet = new Schema({
    radius: {
        type: Int,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    position_x: {
        type: Int,
        required: true
    },
    position_y: {
        type: Int,
        required: true
    }
});

Planet.methods.getRadius = function () {
    return TRUE;
};
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

module.exports = mongoose.model('Planet', Planet);