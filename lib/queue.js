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
                self.unavailable_workers.push(worker);

                espial.cluster.send("job", job, worker);

                espial.cluster.join(["job", job.uid].join(":"));
                espial.cluster.on(["job", job.uid].join(":"), function(response){
                    espial.cluster.leave(["job", job.uid].join(":"));

                    if(_.contains(self.unavailable_workers, worker))
                        self.add_worker(worker);

                    return next(response);
                });
            });
        }, 0);
    },

    increase_concurrency: function(amount){
        var was_empty = false;
        if(this.queue.concurrency == 0)
            was_empty = true;

        this.queue.concurrency = this.queue.concurrency + amount;

        if(was_empty)
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
                    handlers.on_success(job, response);
                else
                    handlers.on_failure(job, response);
            });
        }
        else
            this.stash.push(job);
    },

    get_available_worker: function(){
        return _.sample(this.available_workers);
    },

    add_worker: function(worker, copies){
        var self = this;
        async.timesSeries(copies || 1, function(index, next){
            self.available_workers.push(worker);
            return next();
        });
    },

    remove_worker: function(worker){
        this.available_workers = _.remove(this.available_workers, function(w){
            return !_.isEqual(w, worker);
        });

        this.unavailable_workers = _.remove(this.unavailable_workers, function(w){
            return !_.isEqual(w, worker);
        });
    },

    available_workers: [],

    unavailable_workers: [],

    stash: []

}
