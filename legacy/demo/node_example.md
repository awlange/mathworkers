Main code:

```JavaScript
var MathWorkers = require("mathworkers.js");
MathWorkers.Global.setNode(true);

var crd = new MathWorkers.Coordinator(4, "work.js");

if (MathWorkers.Global.isMaster()) {
    var masterThread = require("coord.js");
    masterThread.run(MathWorkers, crd);
}
```

Coordinator code (coord.js):

```JavaScript
var run = function(MathWorkers, crd) {
    crd.onReady(function() {
    	crd.trigger("run");
    });

    crd.on("done", function() {
        var dot = crd.getBuffer();
        console.log(dot);

        // Disconnect from the workers to terminate the program
        crd.disconnect();
    });
}

exports.run = run;
```

Worker code (work.js):

```JavaScript
var MathWorkers = require("mathworkers.js");
MathWorkers.Global.setNode(true);

var worker = new MathWorkers.MathWorker();

worker.on("run", function() {
	var v = Vector.randomVector(1024);
	var w = Vector.randomVector(1024);
	v.workerDotVector(w, "done");
});

```