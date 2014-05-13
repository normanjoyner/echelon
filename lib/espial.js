var _ = require("lodash");
var Espial = require("espial");
var handlers = require([__dirname, "handlers"].join("/"));

module.exports = {

    cluster: null,

    init: function(echelon, fn){
        var queue = require([__dirname, "queue"].join("/"));
        this.cluster = new Espial(echelon.options.espial);
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
                if(cluster.is_master())
                    queue.add_worker(node);
            });

            // handle node being added
            cluster.on("removed_node", function(node){
                if(cluster.is_master())
                    queue.remove_worker(node);
            });

            // execute new job
            cluster.on("job", function(job){
                if(_.has(handlers.handlers, job.handler) && !_.isEmpty(cluster.get_master())){
                    handlers.handlers[job.handler](job.data, function(response){
                        if(_.isUndefined(response))
                            response = {};

                        if(!_.isBoolean(response.success))
                            response.success = true;

                        cluster.send(["job", job.uid].join(":"), response, cluster.get_master());
                    });
                }
                else
                    cluster.send(["job", job.uid].join(":"), new Error(["Cannot find handler", job.handler].join(": "), cluster.get_master()));
            });

            fn();
        });

    },

    get_nodes: function(){
        return this.cluster.get_nodes();
    }

}
