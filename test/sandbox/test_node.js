var MathWorkers = require("../../dist/mathworkers.js");
var mwi = new MathWorkers.Interface(1, "../../dist/mathworkers.worker.js", true);

mwi.broadcastMessage("hey there");

var v = new MathWorkers.Vector.random(8);
