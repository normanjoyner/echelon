var _ = require("lodash");
var queue = require([__dirname, "lib", "queue"].join("/"));
var handlers = require([__dirname, "lib", "handlers"].join("/"));
var espial = require([__dirname, "lib", "espial"].join("/"));

// define Echelon
function Echelon(){}

// initialize Echelon
Echelon.prototype.init = function(options, fn){
    this.options = _.defaults(options, {
        espial: {}
    });

    if(!_.has(this.options.espial, "metadata")){
        this.options.espial = _.merge(this.options.espial, {
            metadata: {
                concurrency: 1
            }
        });
    }
    else if(!_.has(this.options.espial.metadata, "concurrency"))
        this.options.espial.metadata.concurrency = 1

    queue.init();
    espial.init(this, fn);
}

// add job handler
Echelon.prototype.add_handler = function(name, handler){
    handlers.add(name, handler);
}

// remove job handler
Echelon.prototype.remove_handler = function(name){
    handlers.remove(name);
}

// add job to the queue
Echelon.prototype.add_job = function(job){
    // if we're the master node, add the job to the queue
    if(espial.cluster.is_master())
        queue.push(job);

    // if find a master, send the job to them
    else if(!_.isEmpty(this.espial.get_master()))
        espial.cluster.send("add_job", job, this.espial.get_master());

    // hold the job until we find a master
    else
        queue.stash(job);
}

module.exports = Echelon;
