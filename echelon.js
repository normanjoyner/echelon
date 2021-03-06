var _ = require("lodash");
var queue = require([__dirname, "lib", "queue"].join("/"));
var handlers = require([__dirname, "lib", "handlers"].join("/"));
var espial = require([__dirname, "lib", "espial"].join("/"));

// define Echelon
function Echelon(){}

// initialize Echelon
Echelon.prototype.init = function(options, fn){
    this.options = _.defaults(options, {
        concurrency: 1,
        espial: {
            metadata: {}
        }
    });

    this.options.espial.metadata.concurrency = this.options.concurrency;

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

// override default on_success handler
Echelon.prototype.on_success = function(success_handler){
    handlers.on_success = success_handler;
}

// override default on_failure handler
Echelon.prototype.on_failure = function(failure_handler){
    handlers.on_failure = failure_handler;
}

// add job to the queue
Echelon.prototype.add_job = function(job){
    // if we're the master node, add the job to the queue
    if(espial.cluster.is_master())
        queue.push(job);

    // if find a master, send the job to them
    else if(!_.isEmpty(espial.cluster.get_master()))
        espial.cluster.send("add_job", job, espial.cluster.get_master());

    // hold the job until we find a master
    else
        queue.stash.push(job);
}

// get number of jobs waiting to be processed
Echelon.prototype.queue_length = function(){
    return queue.queue.length();
}

// determine if queue is idle
Echelon.prototype.idle_jobs = function(){
    return queue.queue.idle();
}

// get number of jobs currently running
Echelon.prototype.running_jobs = function(){
    return queue.queue.running();
}

module.exports = Echelon;
