var MathWorkers = require("../../dist/mathworkers.js");
var mwi = new MathWorkers.Interface(2, "../../dist/mathworkers.worker.js", true);

var dv = mwi.newDistributedVector(new MathWorkers.Vector.ones(8), "a", "1");

dv.on("1", function() {
    dv.gather("3");
}).on("3", function() {
    console.log(dv.getGatheredVector());
});

//dv.on("1", function() {
//    dv.scale(20, "2");
//}).on("2", function() {
//    dv.gather("3");
//}).on("3", function() {
//    console.log(dv.getGatheredVector());
//});
