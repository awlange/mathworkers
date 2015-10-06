// TODO: node.js tests
var MathWorkers = require("../../dist/mathworkers.js");
MathWorkers.Global.setNode(true);  // Turn on node.js mode
//MathWorkers.Global.setLogLevel(1);
//MathWorkers.Global.setUnrollLoops(true);

// Path is relative to where the mathworkers.js file is located
var coord = new MathWorkers.Coordinator(4, "../performance/node/performance_parallel_work.js");

// Branch the master process away from the workers here
if (MathWorkers.Global.isMaster()) {
    var masterThread = require("./performance_parallel_coord.js");
    masterThread.run(MathWorkers, coord);
}
