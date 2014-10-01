

/**
 *  Coordinator for browser-side interface
 */
MW.Coordinator = function(nWorkersInput, workerScriptName, logLevel) {
	var that = this;
	var objectBuffer = {};
	var messageBuffer = [];
	var logLevel = logLevel || 2;
	var ready = false;
	log.setLevel("coord", logLevel);

	// Create the worker pool, which starts the workers
	pool.create(nWorkersInput, workerScriptName, logLevel);

	this.isReady = function() {
		return ready;
	}

	this.getBuffer = function() {
		return objectBuffer;
	}

	this.getMessages = function() {
		return messageBuffer;
	}

	this.newVector = function(size) {
		return new MW.Vector(size);
	}

	this.newVectorFromArray = function(arr) {
		return MW.Vector.fromArray(arr);
	}

	this.newMatrix = function(nrows, ncols) {
		return new MW.Matrix(nrows, ncols);
	}

	this.newMatrixFromArray = function(arr) {
		return MW.Matrix.fromArray(arr);
	}

	this.trigger = function(tag, args) {
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			pool.getWorker(wk).postMessage({handle: "trigger", tag: tag, args: args});
		}
	}

	this.sendVectorToWorkers = function(vec, tag) {
		// Must make a copy of the vector for each worker for transferrable object message passing
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			var v = new Float64Array(vec.getArray());
			pool.getWorker(wk).postMessage({handle: "broadcastVector", tag: tag, 
				vec: v.buffer}, [v.buffer]);
		}
	}

	this.sendMatrixToWorkers = function(mat, tag) {
		// Must make a copy of each matrix row for each worker for transferrable object message passing
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			var matObject = {handle: "broadcastMatrix", tag: tag, nrows: mat.nrows};
			var matBufferList = [];
			for (var i = 0; i < mat.nrows; ++i) {
				var row = new Float64Array(mat.getRow(i));
				matObject[i] = row.buffer;
				matBufferList.push(row.buffer);
			}
			pool.getWorker(wk).postMessage(matObject, matBufferList);
		}
	}

	// Route the message appropriately for the Worker
 	var onmessageHandler = function(event) {
 		var data = event.data;
 		switch (data.handle) {
 			case "workerReady":
 				handleWorkerReady();
 				break;
 			case "textFromWorker":
 				handleTextFromWorker(data);
 				break;
 			case "vectorSendToCoordinator":
 				handleVectorSendToCoordinator(data);
 				break;
 			case "gatherVector":
 				handleGatherVector(data);
 				break;
 			case "matrixSendToCoordinator":
 				handleMatrixSendToCoordinator(data);
 				break;
 			 case "gatherMatrix":
 				handleGatherMatrix(data);
 				break;
  			case "vectorNorm":
 				handleVectorNorm(data);
 				break;
  			case "vectorSum":
 				handleVectorSum(data);
 				break;
 			default:
 				log.error("Invalid Coordinator handle: " + data.handle);
 		}
 	}

 	// Register the above onmessageHandler for each worker in the pool
 	// Also, initialize the message buffer with empty strings
 	for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
 		pool.getWorker(wk).onmessage = onmessageHandler;
 		messageBuffer.push("");
 	}

 	// Reduction function variables
 	var nWorkersReported = 0;
 	var tot = 0.0;
 	var gatherVector = {};
 	var gatherMatrix = {};

 	var handleWorkerReady = function() {
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
 			ready = true;
 			that.emit("ready");
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	}

 	var handleTextFromWorker = function(data) {
 		messageBuffer[data.id] = data.text;
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
 			that.emit(data.tag);
 			// reset for next message
			nWorkersReported = 0;	
 		}
 	}

	var handleVectorSendToCoordinator = function(data) {
		objectBuffer = new MW.Vector();
		objectBuffer.setVector(new Float64Array(data.vectorBuffer));
		that.emit(data.tag);
	}

	var handleMatrixSendToCoordinator = function(data) {
		var tmp = [];
		for (var i = 0; i < data.nrows; ++i) {
			tmp.push(new Float64Array(data[i]));
		}
		objectBuffer = new MW.Matrix();
		objectBuffer.setMatrix(tmp);
		that.emit(data.tag);
	}

	var handleGatherVector = function(data) {
		// Reduce the vector parts from each worker
		var id = data.id;
		gatherVector[id] = new Float64Array(data.vectorPart);
		tot += data.len;

		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// build the full vector and save to buffer
			objectBuffer = new MW.Vector();
			objectBuffer.setVector(buildVectorFromParts(gatherVector, tot));

			// emit and reset
			that.emit(data.tag);
			nWorkersReported = 0;
			tot = 0;
			gatherVector = {};
		}
	}

	var buildVectorFromParts = function(gatherVector, totalLength) {
		var vec = new Float64Array(totalLength);
		var offset = 0;
		for (var i = 0; i < pool.getNumWorkers(); ++i) {
			for (var j = 0; j < gatherVector[i].length; ++j) {
				vec[offset + j] = gatherVector[i][j];
			}
			offset += gatherVector[i].length;
		}
		return vec;
	}

	var handleGatherMatrix = function(data) {
		// Reduce the matrix rows from each worker
		var id = data.id;
		for (var i = 0; i < data.nrows; ++i) {
			gatherMatrix[data.offset + i] = new Float64Array(data[i]);
		}
		tot += data.nrows;

		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// build the full vector and save to buffer
			objectBuffer = new MW.Matrix();
			objectBuffer.setMatrix(buildMatrixFromParts(gatherMatrix, tot));

			// emit and reset
			that.emit(data.tag);
			nWorkersReported = 0;
			tot = 0;
			gatherMatrix = {};
		}
	}

	var buildMatrixFromParts = function(gatherMatrix, totalRows) {
		var result = []
		for (var i = 0; i < totalRows; ++i) {
			result.push(gatherMatrix[i]);
		}
		return result;
	}

	var handleVectorNorm = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// save result to buffer and emit to the browser-side coordinator
			objectBuffer = Math.sqrt(tot);
			that.emit(data.tag);

			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	}

	var handleVectorSum = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// save result to buffer and emit to the browser-side coordinator
			objectBuffer = tot;
			//that.emit(data.tag);

			// broadcast?
			if (data.broadcast) {
				for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
					pool.getWorker(wk).postMessage({handle: "broadcast", tag: data.tag, args: [tot]});
				}
			} else {
				// otherwise, do the usual emission
				that.emit(data.tag);
			}

			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	}

}
MW.Coordinator.prototype = new EventEmitter();

