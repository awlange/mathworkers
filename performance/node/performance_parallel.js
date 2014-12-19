// TODO: node.js tests
var MWs = require("../../lib/mathworkers.js");

// Turn on node.js mode
MWs.Global.setNode(true);
//MWs.Global.setLogLevel(3);
// Path is relative to where the mathworkers.js file is located
var coord = new MWs.Coordinator(4, "../performance/node/performance_parallel_work.js");

coord.onReady( function() {
    coord.trigger("foo");
});

coord.on("bar", function() {
    var messageList = coord.getMessageDataList();
    console.log(messageList);

    coord.disconnect();
});

