/*
 * MathWorker node.js tests
 */
var MWs = require("../../lib/mathworkers.js");
var UT = require("../unit_tester.js");
MWs.Global.setNode(true);

// Path is relative to where the mathworkers.js file is located
var crd = new MWs.Coordinator(2, "../test/node/test_core_parallel_work.js");
var Vector = MWs.Vector;
var Matrix = MWs.Matrix;

var nTests = 0;
var passes = 0;

function updatePasses(T) {
    nTests += 1;
    if (T.pass) {
        passes += 1;
    }
}

crd.onReady(function() {
    crd.trigger("run_sendDataToCoordinator");
});

crd.on("sendDataToCoordinator", function() {
    var T = new UT.Tester("sendDataToCoordinator");
    var messageList = crd.getMessageDataList();
    T.equal("Hello from worker 0 of 2 workers.", messageList[0]);
    T.equal("Hello from worker 1 of 2 workers.", messageList[1]);
    T.passed();
    updatePasses(T);

    //crd.sendDataToWorkers(12345, "run_sendDataToWorkers");

    console.log(passes + " passed of " + nTests + " tests.");

});

console.log(MWs.Global.isMaster());

crd.on("disconnect", function(){
    crd.disconnect();
});