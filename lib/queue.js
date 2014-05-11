var _ = require("lodash");
var async = require("async");
var espial = require([__dirname, "espial"].join("/"));
var handlers = require([__dirname, "handlers"].join("/"));
var jobs = require([__dirname, "jobs"].join("/"));

module.exports = {

    init: function(){
        var self = this;
        this.queue = async.queue(function(job, next){
            jobs.generate(job, function(job){
                if(_.isUndefined(job))
                    return next();

                var worker = self.get_available_worker();
                espial.cluster.send("job", job, worker);

                espial.cluster.on(["job", job.uid].join(":"), function(response){
                    self.add_available_worker(worker);
                    return next(response);
                });
            });
        }, 0);
    },

    increase_concurrency: function(){
        this.queue.concurrency = this.queue.concurrency + 1;

        if(this.queue.concurrency == 1)
            this.bootstrap_stashed_jobs();
    },

    decrease_concurrency: function(){
        this.queue.concurrency = this.queue.concurrency - 1;
    },

    bootstrap_stashed_jobs: function(){
        var self = this;
        _.each(this.stash, function(job){
            self.push(job);
        });
    },

    push: function(job){
        if(this.queue.concurrency > 0){
            this.queue.push(job, function(response){
                if(response.success)
                    handlers.handlers.on_success(job);
                else
                    handlers.handlers.on_failure(job);
            });
        }
        else
            this.stash.push(job);
    },

    get_available_worker: function(){
        return _.sample(this.workers);
    },

    add_available_worker: function(worker){
        this.workers.push(worker);
    },

    remove_available_worker: function(worker){
        this.workers = _.remove(this.workers, function(w){
            return !_.isEqual(w, worker);
        });
    },

    workers: [],

    stash: []

}
