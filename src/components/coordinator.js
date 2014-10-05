

/**
 *  Coordinator for browser-side interface
 */
MW.Coordinator = function(nWorkersInput, workerScriptName, logLevel) {
	var that = this;
	var objectBuffer = {};
	var messageDataBuffer = [];
	var ready = false;

    logLevel = logLevel || 2;
	log.setLevel("coord", logLevel);

	// Create the worker pool, which starts the workers
	pool.create(nWorkersInput, workerScriptName, logLevel);

	this.isReady = function() {
		return ready;
	};

	this.getBuffer = function() {
		return objectBuffer;
	};

	this.getMessageDataList = function() {
		return messageDataBuffer;
	};

	this.newVector = function(size) {
		return new MW.Vector(size);
	};

	this.newVectorFromArray = function(arr) {
		return MW.Vector.fromArray(arr);
	};

	this.newMatrix = function(nrows, ncols) {
		return new MW.Matrix(nrows, ncols);
	};

	this.newMatrixFromArray = function(arr) {
		return MW.Matrix.fromArray(arr);
	};

	this.trigger = function(tag, args) {
		for (var wk = 0; wk < pool.nWorkers; ++wk) {
            console.log("Trigger tag " + wk + " : " + tag);
			pool.getWorker(wk).postMessage({handle: "_trigger", tag: tag, args: args});
		}
	};

	this.sendDataToWorkers = function(dat, tag) {
		for (var wk = 0; wk < pool.nWorkers; ++wk) {
			pool.getWorker(wk).postMessage({handle: "_broadcastData", tag: tag, data: dat});
		}
	};

	this.sendVectorToWorkers = function(vec, tag) {
		// Must make a copy of the vector for each worker for transferable object message passing
		for (var wk = 0; wk < pool.nWorkers; ++wk) {
			var v = new Float64Array(vec.array);
			pool.getWorker(wk).postMessage({handle: "_broadcastVector", tag: tag,
				vec: v.buffer}, [v.buffer]);
		}
	};

	this.sendMatrixToWorkers = function(mat, tag) {
		// Must make a copy of each matrix row for each worker for transferable object message passing
		for (var wk = 0; wk < pool.nWorkers; ++wk) {
			var matObject = {handle: "_broadcastMatrix", tag: tag, nrows: mat.nrows};
			var matBufferList = [];
			for (var i = 0; i < mat.nrows; ++i) {
				var row = new Float64Array(mat.getRow(i));
				matObject[i] = row.buffer;
				matBufferList.push(row.buffer);
			}
			pool.getWorker(wk).postMessage(matObject, matBufferList);
		}
	};

    // Convenience on ready to hide the handle
    this.onReady = function(callBack) {
        this.on("_ready", callBack);
    };

	// Route the message appropriately for the Worker
 	var onmessageHandler = function(event) {
 		var data = event.data;
 		switch (data.handle) {
 			case "_workerReady":
 				handleWorkerReady();
 				break;
 			case "_sendData":
 				handleSendData(data);
 				break;
 			case "_vectorSendToCoordinator":
 				handleVectorSendToCoordinator(data);
 				break;
 			case "_gatherVector":
 				handleGatherVector(data);
 				break;
 			case "_matrixSendToCoordinator":
 				handleMatrixSendToCoordinator(data);
 				break;
 			 case "_gatherMatrix":
 				handleGatherMatrix(data);
 				break;
  			case "_vectorNorm":
 				handleVectorNorm(data);
 				break;
  			case "_vectorSum":
 				handleVectorSum(data);
 				break;
 			default:
 				log.error("Invalid Coordinator handle: " + data.handle);
 		}
 	};

 	// Register the above onmessageHandler for each worker in the pool
 	// Also, initialize the message data buffer with empty objects
 	for (var wk = 0; wk < pool.nWorkers; ++wk) {
 		pool.getWorker(wk).onmessage = onmessageHandler;
 		messageDataBuffer.push({});
 	}

 	// Reduction function variables
 	var nWorkersReported = 0;
 	var tot = 0.0;
 	var gatherVector = {};
 	var gatherMatrix = {};

 	var handleWorkerReady = function() {
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.nWorkers) {
 			ready = true;
 			that.emit("_ready");
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	};

 	var handleSendData = function(data) {
 		messageDataBuffer[data.id] = data.data;
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.nWorkers) {
 			that.emit(data.tag);
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	};

	var handleVectorSendToCoordinator = function(data) {
		objectBuffer = new MW.Vector();
		objectBuffer.setVector(new Float64Array(data.vectorBuffer));
		that.emit(data.tag);
	};

	var handleMatrixSendToCoordinator = function(data) {
		var tmp = [];
		for (var i = 0; i < data.nrows; ++i) {
			tmp.push(new Float64Array(data[i]));
		}
		objectBuffer = new MW.Matrix();
		objectBuffer.setMatrix(tmp);
		that.emit(data.tag);
	};

	var handleGatherVector = function(data) {
		// Reduce the vector parts from each worker
		var id = data.id;
		gatherVector[id] = new Float64Array(data.vectorPart);
		tot += data.len;

		nWorkersReported += 1;
		if (nWorkersReported == pool.nWorkers) {
			// build the full vector and save to buffer
			objectBuffer = new MW.Vector();
			objectBuffer.setVector(buildVectorFromParts(gatherVector, tot));
			if (data.rebroadcast) {
				that.sendVectorToWorkers(objectBuffer, data.tag);
			} else {
				// emit
				that.emit(data.tag);
			}
			// reset
			nWorkersReported = 0;
			tot = 0;
			gatherVector = {};
		}
	};

	var buildVectorFromParts = function(gatherVector, totalLength) {
		var vec = new Float64Array(totalLength);
		var offset = 0;
		for (var i = 0; i < pool.nWorkers; ++i) {
			for (var j = 0; j < gatherVector[i].length; ++j) {
				vec[offset + j] = gatherVector[i][j];
			}
			offset += gatherVector[i].length;
		}
		return vec;
	};

	var handleGatherMatrix = function(data) {
		// Reduce the matrix rows from each worker
		for (var i = 0; i < data.nrows; ++i) {
			gatherMatrix[data.offset + i] = new Float64Array(data[i]);
		}
		tot += data.nrows;

		nWorkersReported += 1;
		if (nWorkersReported == pool.nWorkers) {
			// build the full vector and save to buffer
			objectBuffer = new MW.Matrix();
			objectBuffer.setMatrix(buildMatrixFromParts(gatherMatrix, tot));
            console.log("Dude: " + data.rebroadcast);
			if (data.rebroadcast) {
				that.sendMatrixToWorkers(objectBuffer, data.tag);
			} else {
				// emit
				that.emit(data.tag);
			}
			//reset
			nWorkersReported = 0;
			tot = 0;
			gatherMatrix = {};
		}
	};

	var buildMatrixFromParts = function(gatherMatrix, totalRows) {
		var result = [];
		for (var i = 0; i < totalRows; ++i) {
			result.push(gatherMatrix[i]);
		}
		return result;
	};

	var handleVectorNorm = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.nWorkers) {
			objectBuffer = Math.sqrt(tot);
			if (data.rebroadcast) {
				// rebroadcast the result back to the workers
				that.sendDataToWorkers(objectBuffer, data.tag);
			} else {
				// save result to buffer and emit to the browser-side coordinator
				that.emit(data.tag);
			}

			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	};

	var handleVectorSum = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.nWorkers) {
			objectBuffer = tot;
			if (data.rebroadcast) {
				// rebroadcast the result back to the workers
				that.sendDataToWorkers(objectBuffer, data.tag);
			} else {
				// save result to buffer and emit to the browser-side coordinator
				that.emit(data.tag);
			}
			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	};

};
MW.Coordinator.prototype = new EventEmitter();

