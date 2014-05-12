echelon
======

##About

###Description
Echelon is a distributed work queue built on [Espial](https://github.com/normanjoyner/espial).

Echelon uses the master Espial node to distribute jobs to slave nodes. Slave nodes perform computation and return results to the master node. The registration of custom handlers allow for different types of jobs to be handled by the same cluster. More to come!

###Author
* Norman Joyner - <norman.joyner@gmail.com>

##Getting Started

###Installation
```npm install echelon```

###Configuration
To get running, require echelon and instantiate a new Echelon object. When you are ready to start the node, simply call ```echelon.init()``` and pass configuration options and a callback. For example:

```javascript
var Echelon = require("echelon");
var echelon = new Echelon();

var options = {
    concurrency: 4,
    espial: {}
}

echelon.init(options, function(){
    console.log("node started!");
});
```

* ```espial```: (optional) Object passed to Espial for configuration. See Espial documentation for more information.
* ```concurrency```: (optional) The number of concurrent jobs this node can process.

##Features

###Distributed Job Processing
Echelon serves as a distributed work queue, responsible for performing job processing. The Espial master node is responsible for distributing jobs to worker nodes. The master node **never** processes jobs, but rather manages the job queue, job distribution, and so on. Each node has the ability to specify the number of concurrent jobs it can process during configuration, as seen above. By running a cluster of nodes, a greater amount of jobs can be processed in parallel, significantly reducing processing time. Given that Echelon is a module, it is quite extensible and can be used in a wide variety of applications.

###Default Handlers
Echelon comes with two default handlers used on the master node: ```on_success``` and ```on_failure```. When a job is finished it will execute one of these callbacks dependant upon whether it was successfully processed or not. By default, Echelon simply logs whether the job was successful or not to the console. These handlers can be overriden using the ```on_success()``` and ```on_failure()``` methods:

```javascript
echelon.on_success(function(job, response){
    console.log(job.uid + " was successful!");
});

echelon.on_failure(function(job, response){
    console.log(job.uid + " failed!");
});
```

The ```job``` object returned will contain the ```Job``` schema, including the uniquely generated ```uid``` key. The ```response``` object will contain the object returned from the custom handler. More on customer handlers below.

###Custom Handlers
On worker nodes, handlers are responsible for performing the work necessary to "complete" a job. The schema of a ```Job``` object contains a ```handler``` key, which specifies which handler to use to process the job. An example job may look like:

```javascript
var job = {
    handler: "my_first_handler",
    data: {
        some: "data",
        can: ["go", "here"]
    }
}
```

To process the above job, a handler must be registered on worker nodes for "my_first_handler". To register a new handler, simple call ```add_handler()``` as seen below:

```javascript
echelon.add_handler("my_first_handler", function(data, fn){
    return fn({
        success: true,
        attribute: [data.some, can.length].join(" ");
    });
});
```

Obviously this is an **extremely simplified** example of job processing; however, it is evident how a handler could be extended to perform powerful processing.

The ```fn()``` callback returns a custom object which will be sent back to the master (distributor) node. The ```success``` attribute specifies whether the job was successfully processed or not. If the ```success``` key is omitted, it defaults to true.

### Pushing Jobs
To push the example job above, use the ```echelon.add_job()``` method. Simply pass the job object as the parameter:

```javascript
var job = {
    handler: "my_first_handler",
    data: {
        some: "data",
        can: ["go", "here"]
    }
}

echelon.add_job(job);
```

Jobs can be added from **any** node in the cluster (not only the master).
