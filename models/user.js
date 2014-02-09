var crypto = require('crypto');

var mongoose = require('utils/mongoose');
/**
 * Object User
 */
function User(name){
    this.name = name;
}

User.prototype.sayHello = function(who){
    console.log( db.getPhrase('Hello') + ', ' + who.name);
};

//exports.User = User;
module.exports = User;
//global.User = GaUserme;
//console.log(module);