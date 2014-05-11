var crypto = require("crypto");
var _ = require("lodash");

module.exports = {

    generate: function(job, fn){
        if(_.has(job, "handler") && _.has(job, "data")){
            generate_uid(function(uid){
                job.uid = uid;
                fn(job);
            });
        }
        else
            return fn();
    }

}

var generate_uid = function(fn){
    crypto.randomBytes(16, function(err, random){
        return fn(random.toString('hex'));
    });
}
