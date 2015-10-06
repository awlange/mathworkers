/*
 * MathWorker node.js tests
 */
var MWs = require("../../../dist/mathworkers.js");
MWs.Global.setNode(true);
//MWs.Global.setLogLevel(3);

// Path is relative to where the mathworkers.js file is located
var crd = new MWs.Coordinator(2, "../test/old_test/node/test_core_parallel_work.js");

// Branch the master process
if (MWs.Global.isMaster()) {
    var masterThread = require("./test_core_parallel_coord");
    masterThread.run(MWs, crd);
}
