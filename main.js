var Echelon = require([__dirname, "echelon"].join("/"));
var pkg = require([__dirname, "package"].join("/"));

exports = module.exports = function(){
    var echelon = new Echelon();
    echelon.version = pkg.version;
    return echelon;
}
