var MathWorkers = require("../../dist/mathworkers.js");
var mwi = new MathWorkers.Interface(4, "../../dist/mathworkers.worker.js", true);

mwi.broadcastMessage("hey there");

var v = new MathWorkers.Vector.random(100);
console.log(v);
