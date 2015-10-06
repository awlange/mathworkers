# MathWorkersJS

A parallel JavaScript math and statistics library built around HTML5 Web Workers and Node.js cluster.

## About

A JavaScript library by [Adrian W. Lange](http://adrianlange.com/).

MathWorkersJS can speed up the performance of JavaScript computations on computers with multi-core processors by distributing computational load among
a pool of workers which execute in parallel.
On the client-side, MathWorkersJS parallelizes in the browser via HTML5 [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).
On the server-side, MathWorkersJS parallelizes via the [cluster module](http://nodejs.org/api/cluster.html) in Node.js.

See the [project homepage](http://www.mathworkersjs.org/).

## Features

- Runs client-side in browsers or server-side with Node.js
- Vector and Matrix classes wrapping Float64Array objects
- Serial and parallel implementations for common linear algebra operations
- Coordinator-Worker parallelism paradigm
- Easy to use communication abstraction
- Familiar event emitter style for handling synchronization

## Documentation

Visit the [project homepage](http://www.mathworkersjs.org/)

## Installation

Using npm:

    npm install mathworkers
    
Using Bower:

    bower install mathworkers

Or grab the [source](https://github.com/awlange/mathworkers/dist/mathworkers.js) ([minified](https://github.com/awlange/mathworkers/dist/mathworkers.min.js)).

## Usage

### Getting Started

To help with getting started, some basic boilerplate code for a MathWorkersJS app is provided in the
"boilerplate" directory for both HTML and Node.js.

### Basic Serial

Basic serial usage for computing a dot product of two Vectors:

```JavaScript
var v = MathWorkers.Vector.randomVector(1024);
var w = MathWorkers.Vector.randomVector(1024);
var dot = v.dotVector(w);
console.log(dot);
```

### Parallel HTML5 Web Workers

To perform the same vector dot product in parallel in a browser with HTML5 Web Workers, MathWorkersJS requires two separate code pieces, 
the code for the workers and the code for the coordinator. (For more details, visit the [project homepage](http://www.mathworkersjs.org/).)

Coordinator code for launching 2 workers:

```JavaScript
// Initialize a Coordinator with 2 workers
var coord = new MathWorkers.Coordinator(2, "work.js");

// Begin the computation once the workers are ready
coord.onReady(function() {
    coord.trigger("compute");
});

// Obtain the resulting dot product
coord.on("dot", function() {
    var dot = crd.getBuffer();
    console.log(dot);
});
```

Worker code, "work.js", which is executed by both workers in parallel:

```JavaScript
// Load MathWorkersJS for this worker
importScripts("mathworkers.js");
var worker = new MathWorkers.MathWorker();

// On the Coordinator trigger, compute the dot product in parallel
worker.on("compute", function() {
    var v = MathWorkers.Vector.randomVector(1024);
    var w = MathWorkers.Vector.randomVector(1024);
    v.workerDotVector(w, "dot");
});
```

### Parallel Node.js cluster:

To perform the same vector dot product in parallel server-side with Node.js, MathWorkersJS again requires two separate code pieces, 
the code for the workers and the code for the coordinator. It additionally requires turning on Node.js mode as well as a conditional to branch
the master thread from the worker threads.

Coordinator code for launching 2 workers:

```JavaScript
// Load MathWorkersJS and turn on Node.js mode
var MathWorkers = require("mathworkers.js");
MathWorkers.Global.setNode(true);

// Initialize a Coordinator with 2 workers
var coord = new MathWorkers.Coordinator(2, "work.js");

// Branch the master thread
if (MathWorkers.Global.isMaster()) {
    // Begin the computation once the workers are ready
    coord.onReady(function() {
        coord.trigger("compute");
    });
   
    // Obtain the resulting dot product
    coord.on("done", function() {
        var dot = coord.getBuffer();
        console.log(dot);
 
        // Disconnect from the workers to terminate the program
        coord.disconnect();
    });
}
```

Worker code, "work.js", which is executed by both workers in parallel:

```JavaScript
// Load MathWorkersJS for this worker and turn on Node.js mode
var MathWorkers = require("mathworkers.js");
MathWorkers.Global.setNode(true);
var worker = new MathWorkers.MathWorker();

// On the Coordinator trigger, compute the dot product in parallel
worker.on("compute", function() {
    var v = Vector.randomVector(1024);
    var w = Vector.randomVector(1024);
    v.workerDotVector(w, "done");
});
```

For advanced usage, see the documentation.

## Contributing

We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request.

We'll do our best to help you out with any contribution issues you may have.

## License

Apache v2.0. See `LICENSE` in this directory.
