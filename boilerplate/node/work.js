/*
 * Worker code for MathWorkersJS Node.js Boilerplate
 */

// Load MathWorkersJS (change path as appropriate)
var MathWorkers = require("../../dist/mathworkers.js");
MathWorkers.Global.setNode(true);
var worker = new MathWorkers.MathWorker();

// On the run event trigger, begin a parallel computation
worker.on("run", function() {
  var id = worker.getId();
  worker.sendDataToCoordinator("Hello from worker " + id, "done");
});
