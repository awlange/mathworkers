// Worker code for node.js tests
var MathWorkers = require("../../lib/mathworkers.js");
MathWorkers.Global.setNode(true);

var MW = new MathWorkers.MathWorker();
var Vector = MathWorkers.Vector;
var Matrix = MathWorkers.Matrix;
var Batch = MathWorkers.Batch;

var EPSILON = 10e-12;

var id;
var nworkers;

MW.on("run_sendDataToCoordinator", function() {
    id = MW.getId();
    nworkers = MW.getNumWorkers();
    MW.sendDataToCoordinator("Hello from worker " + id + " of " + nworkers + " workers.", "sendDataToCoordinator");
});

MW.on("run_sendDataToWorkers", function(arg) {
    id = MW.getId();
    MW.sendDataToCoordinator("Data received by worker " + id  + ": " + arg, "sendDataToWorkers");
});