/**
 *  Vector class
 */
MW.Vector = function(type, input) {
	var that = this;
	this.type = type;

	var arr = util.newTypedArray(type, input);

	this.length = function() {
		return arr.length;
	}

	this.getType = function() {
		return that.type;
	}

	this.getElement = function(i) {
		return arr[i];
	}

	this.getArray = function() {
		return arr;
	}

	this.setElement = function(i, val) {
		arr[i] = val;
	}

	this.dot = function(vecA, nWorkers) {
		if (nWorkers === undefined || nWorkers < 1) {
			// serial execution
			var tot = 0.0;
			var vecAarr = vecA.getArray();
			for (var i = 0; i < arr.length; ++i) {
				tot += arr[i] * vecAarr[i];
			}
			return tot; // not a Promise!
		}
		// parallel execution
		return VectorVectorDot(arr, vecA.getArray(), nWorkers); // a Promise!
	}

	function VectorVectorDot(typedArrayA, typedArrayB, nWorkers) {
		// inherit from Promise
		return new Promise(function(resolve) {

		    // Compute kernel
			var computeKernel = util.functionToURL( function(event) {
				var data = event.data;
				var v = util.newTypedArray(data.type, data.v);
				var w = util.newTypedArray(data.type, data.w);
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
		    var div = typedArrayA.length / nWorkers;
		    var rem = typedArrayA.length % nWorkers;
			for (var n = 0; n < nWorkers; ++n) {

				// create workers, register the compute and reduce kernels
				var wk = new Worker(computeKernel);
				wk.onmessage = reduceKernel;

				// load balance
				var ifrom = n * div;
				var ito = (n + 1) * div;
				if (n == nWorkers-1) {
					ito += rem;  // simple minded way for now
				}

				// split up data to be sent
				var v = util.newTypedArray(that.type, typedArrayA.subarray(ifrom, ito));
				var w = util.newTypedArray(that.type, typedArrayB.subarray(ifrom, ito));

				// Post message to begin computation
				wk.postMessage({
					v: v.buffer, 
					w: w.buffer, 
					type: that.type
				}, [v.buffer, w.buffer]);
			}
		});
	}
}