/*
 * Main code for MathWorkersJS Node.js Boilerplate
 */

// Load MathWorkersJS (change path as appropriate)
var MathWorkers = require("../../dist/mathworkers.js");
MathWorkers.Global.setNode(true);

// Initialize the coordinator with 2 workers (change as desired)
// Path is relative to where the mathworkers.js file is located (change path as appropriate)
var coord = new MathWorkers.Coordinator(2, "../boilerplate/node/work.js");

// Branch the master process away from the workers here
if (MathWorkers.Global.isMaster()) {
  var masterThread = require("./coord.js");
  masterThread.execute(MathWorkers, coord);
}

// CAUTION: Code outside of the conditional block above will also be executed by the worker threads
//          due to the way the cluster module works. It is strongly advised that the user keep the
//          coordinator and worker code separate to avoid problems.
