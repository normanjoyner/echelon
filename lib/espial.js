var _ = require("lodash");
var Espial = require("espial");

module.exports = {

    cluster: null,

    init: function(echelon, fn){
        var queue = require([__dirname, "queue"].join("/"));
        this.cluster = new Espial(); // TODO: make this configurable
        var cluster = this.cluster;

        // wait until espial is listening
        cluster.on("listening", function(){
            cluster.join("job");

            // handle being promoted to master
            cluster.on("promotion", function(data){
                // listen for new jobs
                cluster.on("add_job", function(job){
                    queue.add(job);
                });
            });

            // handle being demoted to slave
            cluster.on("demotion", function(data){
                cluster.leave("add_job");
            });

            // handle node being added
            cluster.on("added_node", function(node){
                if(cluster.is_master()){
                    queue.add_available_worker(node);
                    queue.increase_concurrency();
                }
            });

            // handle node being added
            cluster.on("removed_node", function(node){
                if(cluster.is_master()){
                    queue.remove_available_worker(node);
                    queue.decrease_concurrency();
                }
            });

            // execute new job
            cluster.on("job", function(job){
                if(_.has(echelon.handlers, job.handler) && !_.isEmpty(cluster.get_master())){
                    echelon.handlers[job.handler](job.data, function(err){
                        var state = {};
                        if(err)
                            state.err = err.message;

                        cluster.send(["job", job.id].join(":"), err, cluster.get_master());
                    });
                }
                else
                    cluster.send(["job", job.id].join(":"), new Error(["Cannot find handler", job.handler].join(": "), cluster.get_master()));
            });

            fn();
        });

    },

    get_nodes: function(){
        return this.cluster.get_nodes();
    }

}
