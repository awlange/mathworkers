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
util.newTypedArray = function(type, input) {
	return new Float64Array(input);
	// switch (type) {
	// 	case "Int32":
	// 		return new Int32Array(input);
	// 	case "UInt32":
	// 		return new UInt32Array(input);
	// 	case "Float32":
	// 		return new Float64Array(input);		
	// 	case "Float64":
	// 		return new Float64Array(input);
	// 	default:
	// 		console.error("Invalid type for newArray.");
	// 		return null;
	// }
}

// So that it may be passed along to the worker
var utilNewTypedArrayAsString = "\nvar util = function() {}; util.newTypedArray = " + util.newTypedArray.toString();

// Convert passed in function to a URL object, which can be passed to a Web Worker
util.functionToURL = function(fn) {
	// TODO: consider quickly minifying function somehow
	var str = "self.onmessage = " + fn.toString() + utilNewTypedArrayAsString;
	var blob = new Blob([str], { type: "text/javascript" });
	var URL = window.URL || window.webkitURL;
	return URL.createObjectURL(blob);
}


util.workerScript = util.functionToURL( function(event) {
	var data = event.data;
	var mat = util.newTypedArray(data.type, data.mat);
	var vec = util.newTypedArray(data.type, data.vec);
	var len = data.rto - data.rfrom;

	var result = util.newTypedArray(data.type, len);
	for (var i = 0; i < len; ++i) {
		var tot = 0.0;
		var incols = i * vec.length;
		for (var j = 0; j < vec.length; ++j) {
			tot += mat[incols + j] * vec[j];
		}
		result[i] = tot;
	}
	postMessage({
		result: result.buffer, 
		rfrom: data.rfrom,
		rto: data.rto
	}, [result.buffer]);
	postMessage({});
	//self.close();  // terminates the worker
});



/**
 *  Thread pool class to be initialized at start of program
 */
var threadPool = function() {};

MW.ThreadPool = function(nWorkers) {
	var that = this;
	this.workers = [];

	for (var i = 0; i < nWorkers; ++i) {
		var wk = new Worker(util.workerScript);
		this.workers.push(wk);
		console.log("created worker: " + i);
	}

	this.getWorkers = function() {
		return that.workers;
	}

	this.getWorker = function(i) {
		return that.workers[i];
	}

	threadPool = this;
};
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
}/**
 *  Matrix class
 *
 *  Wraps a one-dimensional typed array
 */
MW.Matrix = function(type, nrows, ncols, ncopies, fromArray) {
	var that = this;
	this.type = type;
	this.nrows = nrows;
	this.ncols = ncols;

	// builds the wrapped one-dimensional typed array based on dimensions
	var mat = util.newTypedArray(type, nrows * ncols);
	this.copies = []
	for (var c = 0; c < ncopies; ++c) {
		var copy = util.newTypedArray(type, nrows * ncols);
		this.copies.push(copy);
	}

	// copy fromArray to mat if provided
	if (fromArray !== undefined && fromArray instanceof Array) {
		for (var i = 0; i < nrows; ++i) {
			var inrows = i * nrows;
			for (var j = 0; j < ncols; ++j) {
				mat[inrows + j] = fromArray[i][j];
			}
		}
	}

	this.getNumRows = function() {
		return that.nrows;
	}

	this.getNumCols = function() {
		return that.ncols;
	}

	this.getType = function() {
		return that.type;
	}

	this.getElement = function(i, j) {
		return mat[i * that.nrows + j];
	}

	this.setElement = function(i, j, val) {
		mat[i * that.nrows + j] = val;
		for (var c = 0; c < ncopies; ++c) {
			that.copies[c][i * that.nrows + j] = val;
		}
	}

	this.timesVector = function(vecA, nWorkers) {
		if (nWorkers === undefined || nWorkers < 1) {
			// serial execution
			var resultVector = new MW.Vector(that.type, that.nrows);
			var vecAarr = vecA.getArray();
			for (var i = 0; i < that.nrows; ++i) {
				var tot = 0.0;
				var incols = i * ncols;
				for (var j = 0; j < that.ncols; ++j) {
					tot += mat[incols + j] * vecAarr[j];
				}
				resultVector.setElement(i, tot);
			}
			return resultVector;  // not a Promise!
		}
		// parallel execution
		return MatrixVectorProduct(mat, vecA.getArray(), nWorkers); // a Promise!
	}

	function MatrixVectorProduct(typedArrayMat, typedArrayVec, nWorkers) {
		// inherit from Promise
		return new Promise(function(resolve) {

		 //    // Compute kernel
			// var computeKernel = util.functionToURL( function(event) {
			// 	var data = event.data;
			// 	var mat = util.newTypedArray(data.type, data.mat);
			// 	var vec = util.newTypedArray(data.type, data.vec);
			// 	var len = data.rto - data.rfrom;

			// 	var result = util.newTypedArray(data.type, len);
			// 	// for (var i = 0; i < len; ++i) {
			// 	// 	var tot = 0.0;
			// 	// 	var incols = i * vec.length;
			// 	// 	for (var j = 0; j < vec.length; ++j) {
			// 	// 		tot += mat[incols + j] * vec[j];
			// 	// 	}
			// 	// 	result[i] = tot;
			// 	// }
			// 	postMessage({
			// 		result: result.buffer, 
			// 		rfrom: data.rfrom,
			// 		rto: data.rto
			// 	}, [result.buffer]);
			// 	self.close();  // terminates the worker
			// });

		    // Reduce kernel
			var resultVector = new MW.Vector(that.type, that.nrows);
			// var nWorkersReported = 0;
			var nWorkersReported = 1;  // master already reported?
			// var reduceKernel = function(event) {
			// 	var data = event.data;
			// 	var vec = util.newTypedArray(that.type, data.result); 
			// 	var len = data.rto - data.rfrom;
			// 	for (var i = 0; i < len; ++i) {
			// 		resultVector.setElement(data.rfrom + i, vec[i]);
			// 	}
			// 	nWorkersReported += 1;
			// 	if (nWorkersReported == nWorkers) {
			// 		resolve(resultVector);  // resolve the Promise!
			// 	}
			// };

			// Launch workers
		    var div = that.nrows / nWorkers;  // master?
		    var rem = that.nrows % nWorkers;
			for (var n = 0; n < nWorkers; ++n) {

				// create workers, register the compute and reduce kernels
				// var wk = new Worker(computeKernel);
				// wk.onmessage = reduceKernel;

				// load balance
				var rfrom = n * div;
				var rto = (n + 1) * div;
				if (n == nWorkers-1) {
					rto += rem;  // simple minded way for now
				}

				// master work
				if (n == nWorkers-1) {
					for (var i = rfrom; i < rto; ++i) {
						var tot = 0.0;
						var incols = i * typedArrayVec.length;
						for (var j = 0; j < typedArrayVec.length; ++j) {
							tot += typedArrayMat[incols + j] * typedArrayVec[j];
						}
						resultVector.setElement(i, tot);
					}
					if (nWorkers == 1) {
						resolve(resultVector);
					}
				} else {

					var reduceKernel = function(event) {
						var data = event.data;
						var vec = util.newTypedArray(that.type, data.result); 
						var len = data.rto - data.rfrom;
						for (var i = 0; i < len; ++i) {
							resultVector.setElement(data.rfrom + i, vec[i]);
						}
						nWorkersReported += 1;
						if (nWorkersReported == nWorkers) {
							resolve(resultVector);  // resolve the Promise!
						}
					};
					// set reduce kernel
					threadPool.getWorker(n).onmessage = reduceKernel;

					// split up data to be sent
					var vec = util.newTypedArray(that.type, typedArrayVec);
					//var vec = new DataView(typedArrayVec.buffer);
					// var mat = util.newTypedArray(that.type, typedArrayMat.subarray(rfrom * that.ncols, rto * that.ncols));
					// var mat = new Float64Array((rto - rfrom) * that.ncols);
					var mat = that.copies[n];


					// Post message to begin computation
					threadPool.getWorker(n).postMessage({
						mat: mat.buffer, 
						vec: vec.buffer, 
						type: that.type,
						rfrom: rfrom,
						rto: rto
					}, [mat.buffer, vec.buffer]);
					// threadPool.getWorker(n).postMessage({
					// 	vec: vec.buffer, 
					// 	type: that.type,
					// 	rfrom: rfrom,
					// 	rto: rto
					// }, [vec.buffer]);
				}
			}

		});
	}
}
return MW;
}());