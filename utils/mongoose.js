var mongoose = require('mongoose');
var config = require('config');
mongoose.connect(config.get('db:connection') + config.get('db:name'), config.get('db:options'));

module.exports = mongoose;