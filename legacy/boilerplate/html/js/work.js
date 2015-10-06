/*
 * Worker code for MathWorkersJS HTML Boilerplate
 */

// Load MathWorkersJS (change path as appropriate)
importScripts("../../../dist/mathworkers.js");
var worker = new MathWorkers.MathWorker();

// On the run event trigger, begin a parallel computation
worker.on("run", function() {
    worker.sendDataToCoordinator("Hello from worker " + worker.getId(), "done");
});
