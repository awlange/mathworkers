// Worker code for node.js
var MathWorkers = require("../../lib/mathworkers.js");
MathWorkers.Global.setNode(true);
var MW = new MathWorkers.MathWorker();

function run() {
    console.log("Hello from process: " + process.pid);

    MW.on("foo", function() {
        MW.sendDataToCoordinator("Hello from process: " + process.pid, "bar");
    });
}

module.exports.run = run;