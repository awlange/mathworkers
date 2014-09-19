/**
 *  MathWorkers.js 
 *  A JavaScript math library that use WebWorkers for parallelization
 *
 *  Adrian W. Lange, 2014
 */
var MathWorkers = (function() {
var MW = {};
/**
 * Internal utility functions
 */
var util = function() {}

// Returns a typed array based on input. Possibilities:
// input = integer length of the new array
// input = typed array or ArrayBuffer to be copied
// input = object, such as an Array
util.newArray = function(type, input) {
	switch (type) {
		case "Int32":
			return new Int32Array(input);
		case "UInt32":
			return new UInt32Array(input);
		case "Float32":
			return new Float64Array(input);		
		case "Float64":
			return new Float64Array(input);
		default:
			console.error("Invalid type for newArray.");
			return null;
	}
}

// So that it may be passed along to the worker
var utilNewArrayAsString = "\nvar util = function() {}; util.newArray = " + util.newArray.toString();

// Convert passed in function to a URL object, which can be passed to a Web Worker
util.functionToURL = function(fn) {
	// TODO: consider quickly minifying function somehow
	var str = "self.onmessage = " + fn.toString() + utilNewArrayAsString;
	var blob = new Blob([str], { type: "text/javascript" });
	var URL = window.URL || window.webkitURL;
	return URL.createObjectURL(blob);
}


/**
 *  Vector class
 */
MW.Vector = function(type, length) {
	var that = this;
	this.type = type;
	this.length = length;

	var arr = util.newArray(type, length);

	this.get = function(i) {
		return arr[i];
	}

	this.getArray = function() {
		return arr;
	}

	this.set = function(i, val) {
		arr[i] = val;
	}

	this.dot = function(x, nWorkers) {
		if (nWorkers === undefined || nWorkers < 1) {
			// serial execution
			var tot = 0.0;
			var xarr = x.getArray();
			for (var i = 0; i < arr.length; ++i) {
				tot += arr[i] * xarr[i];
			}
			return tot; // not a Promise!
		}
		// parallel execution
		return VectorVectorDot(arr, x.getArray(), nWorkers); // a Promise!
	}

	function VectorVectorDot(vecA, vecB, nWorkers) {
		// inherit from Promise
		return new Promise(function(resolve) {

		    // Compute kernel
			var computeKernel = util.functionToURL( function(event) {
				var data = event.data;
				var v = util.newArray(data.type, data.v);
				var w = util.newArray(data.type, data.w);
				var myDot = 0.0;
				for (var i = 0; i < v.length; ++i) {
					myDot += v[i] * w[i];
				}
				postMessage(myDot);
				self.close();  // terminates the worker
			});

		    // Reduce kernel
			var total = 0;
			var nWorkersReported = 0;
			var reduceKernel = function(event) {
				total += event.data;
				nWorkersReported += 1;
				if (nWorkersReported == nWorkers) {
					resolve(total);  // resolve the Promise!
				}
			};

			// Launch workers
		    var div = vecA.length / (nWorkers);
		    var rem = vecA.length % (nWorkers);
			for (var n = 0; n < nWorkers; ++n) {
				// create workers and register the compute kernel
				var wk = new Worker(computeKernel);
				wk.onmessage = reduceKernel;

				// load balance
				var ifrom = n * div;
				var ito = (n + 1) * div;
				if (n == nWorkers-1) {
					ito += rem;  // simple minded way for now
				}

				// split up data to be sent
				var v = util.newArray(that.type, vecA.subarray(ifrom, ito));
				var w = util.newArray(that.type, vecB.subarray(ifrom, ito));

				// Post message to begin computation
				wk.postMessage({v: v.buffer, w: w.buffer, type: that.type}, [v.buffer, w.buffer]);
			}
		});
	}
}
return MW;
}());