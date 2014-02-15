var crypto = require('crypto');
var mongoose = require('utils/mongoose');
var Schema = mongoose.Schema;
/**
 * Object User
 */
var User = new Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    session: {
        type: String,
        unique: true
    }
});

User.methods.get_name = function(){
    return this.name;
};

User.methods.set_name = function(name){
    if(name){
        this.name = email;
        return true;
    }else{
        return false;
    }
};

User.methods.get_email = function(){
    return this.email;
};

User.methods.set_email = function(email){
    if(email){
        this.email = email;
        return true;
    }else{
        return false;
    }
};

User.methods.get_session = function(){
    return this.session;
};

User.methods.set_session = function(){
    this.session = generate_unique_session();
    if(this.session){
        return true;
    }else{
        return false;
    }
};

var generate_unique_session = function(){
    return true;
}

User.methods.get_by_session = function(session_id){
    User.findOne({session: session_id}, function(err, user){
        if (err) throw err;
        return user
    });
}

User.methods.get_by_email = function(email){
    User.findOne({email: email}, function(err, user){
        if (err) throw err;
        return user
    });
}

//exports.User = User;
//module.exports = User;
//global.User = Userme;
//console.log(module);
exports.User = mongoose.model('User', User);
