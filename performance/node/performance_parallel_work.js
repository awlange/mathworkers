// Worker code for node.js
var MWs = require("../../lib/mathworkers.js");

function run(process) {
    console.log("Hello from process: " + process.pid);
}

module.exports.run = run;