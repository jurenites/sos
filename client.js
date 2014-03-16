if(typeof exports == "undefined"){
    exports = this;
}

Client = function() {
    this.init();
};

Client.prototype = {
    init: function() {
        console.log('im a client code!');



    }
};

exports.Client = new Client();