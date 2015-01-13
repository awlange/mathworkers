Coordinator code:

```JavaScript
var crd = new MathWorkers.Coordinator(4, "work.js");
crd.onReady(function() {
	crd.trigger("run");
});

crd.on("done", function() {
    var dot = crd.getBuffer();
    console.log(dot);
});
```

Worker code:

```JavaScript
importScripts("mathworkers.js");
var worker = new MathWorkers.MathWorker();

worker.on("run", function() {
	var v = Vector.randomVector(1024);
	var w = Vector.randomVector(1024);
	v.workerDotVector(w, "done");
});
```
