var _ = require("lodash");
var async = require("async");
var espial = require([__dirname, "espial"].join("/"));
var handlers = require([__dirname, "handlers"].join("/"));
var jobs = require([__dirname, "jobs"].join("/"));

module.exports = {

    queue: null,

    bootstrap_stashed_jobs: function(){
        var self = this;
        _.each(this.stash, function(job){
            self.push(job);
        });
    },

    push: function(job){
        if(_.keys(this.workers).length > 0){
            var queue = this.get_available_worker();
            queue.push(job, function(response){
                if(response.success)
                    handlers.on_success(job, response);
                else
                    handlers.on_failure(job, response);
            });
        }
        else
            this.stash.push(job);
    },

    get_available_worker: function(){
        var available_workers = _.filter(this.workers, function(worker){
            return worker.running() < worker.concurrency;
        });

        if(_.isEmpty(available_workers))
            available_workers = this.workers;

        return _.sample(available_workers);
    },

    add_worker: function(worker){
        this.workers[worker.key] = async.queue(generate_queue(worker), worker.metadata.concurrency);
        if(_.keys(this.workers).length == 1)
            this.bootstrap_stashed_jobs();
    },

    remove_worker: function(worker){
        if(_.has(this.workers, worker)){
            this.workers[worker].kill();
            delete this.workers[worker];
        }
    },

    workers: {},

    stash: []

}

var generate_queue = function(worker){
    return function(job, next){
        jobs.generate(job, function(job){
            if(_.isUndefined(job))
                return next();

            espial.cluster.send("job", job, worker);

            espial.cluster.join(["job", job.uid].join(":"));
            espial.cluster.on(["job", job.uid].join(":"), function(response){
                espial.cluster.leave(["job", job.uid].join(":"));
                return next(response);
            });
        });
    }
}
