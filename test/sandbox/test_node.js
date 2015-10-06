// node.js test

var MathWorkers = require("../../dist/mathworkers.js");
var coord = new MathWorkers.Coordinator(2, "../../dist/mathworkers.worker.js", true);
