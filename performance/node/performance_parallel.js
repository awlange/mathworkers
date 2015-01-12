// TODO: node.js tests
var MWs = require("../../lib/mathworkers.js");
MWs.Global.setNode(true);  // Turn on node.js mode
//MWs.Global.setLogLevel(1);
//MWs.Global.setUnrollLoops(true);

// Path is relative to where the mathworkers.js file is located
var coord = new MWs.Coordinator(4, "../performance/node/performance_parallel_work.js");

// Branch the master process away from the workers here
if (MWs.Global.isMaster()) {
    var masterThread = require("./performance_parallel_coord.js");
    masterThread.run(MWs, coord);
}
