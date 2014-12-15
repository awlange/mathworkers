// TODO: node.js tests
var MWs = require("../../lib/mathworkers.js");

// Turn on node.js mode
MWs.Global.setNode(true);
// Path is relative to where the mathworkers.js file is located
var coord = new MWs.Coordinator(1, "../performance/node/performance_parallel_work.js");

coord.disconnect();