module.exports = {

    handlers: {
        on_success: function(job){
            console.log("success");
        },

        on_failure: function(job){
            console.log("failure");
        }
    },

    add: function(name, handler){
        this.handlers[name] = handler;
    },

    remove: function(name){
        delete this.handlers[name];
    }

}
