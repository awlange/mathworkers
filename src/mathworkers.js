/**
 *  MathWorkers.js 
 *  A JavaScript math library that use WebWorkers for parallelization
 *
 *  Adrian W. Lange, 2014
 */
var MathWorkers = (function() {
var MW = {};
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
				tot += arr[i] * x.arr[i];
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
				var v = util.newArray(that.type, event.data.v);
				var w = util.newArray(that.type, event.data.w);
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
				wk.postMessage({v: v.buffer, w: w.buffer}, [v.buffer, w.buffer]);
			}
		});
	}
}
return MW;
}());