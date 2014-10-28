Coordinator code:

```JavaScript
var crd = new MathWorkers.Coordinator(2, "work.js");
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
var MW = new MathWorkers.MathWorker();

MW.on("run", function() {
	var v = Vector.randomVector(1024);
	var w = Vector.randomVector(1024);
	v.wkDotVector(w, "done");
});
```
