var crypto = require('crypto');
var config = require('config');
var mongoose = require('utils/mongoose');
var Schema = mongoose.Schema;
/**
 * Object User
 */
var User = new Schema({
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    session: {
        type: String,
        unique: true
    }
});

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
    var hash;
    var counter = 0;
    //@todo test generation of unique session!
    do{
        hash = generate_hash();
        counter++;
        if(counter > 10){
            return false;
        }
    }while(
        mongoose.model('User').get_by_session(hash, function(user){
            if (user){
                return true;
            }else{
                return false;
            }
        }));
    return hash;
}

var generate_hash = function(){
    //@todo add better salt!
    var current_time = new Date();
    var hash = crypto.createHmac('sha1', current_time.getTime() + config.get('session:salt')).digest('hex');
    return hash;
}

User.statics.get_by_session = function(session_id, callback){
    mongoose.model('User').findOne({session: session_id}, callback);
}

User.statics.get_by_email = function(email){
    mongoose.model('User').findOne({email: email}, function(err, user){
        if (err) throw err;
        return user
    });
}

//exports.User = User;
//module.exports = User;
//global.User = Userme;
//console.log(module);
exports.User = mongoose.model('User', User);