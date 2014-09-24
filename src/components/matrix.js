/**
 *  Matrix class
 *
 *  Wraps a one-dimensional typed array
 */
MW.Matrix = function(type, nrows, ncols, fromArray) {
	var that = this;
	this.type = type;
	this.nrows = nrows;
	this.ncols = ncols;

	// builds the wrapped one-dimensional typed array based on dimensions
	var mat = util.newTypedArray(type, nrows * ncols);

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
					var mat = util.newTypedArray(that.type, typedArrayMat.subarray(rfrom * that.ncols, rto * that.ncols));
					var vec = util.newTypedArray(that.type, typedArrayVec);

					// Post message to begin computation
					threadPool.getWorker(n).postMessage({
						mat: mat.buffer, 
						vec: vec.buffer, 
						type: that.type,
						rfrom: rfrom,
						rto: rto
					}, [mat.buffer, vec.buffer]);
				}
			}

		});
	}
}