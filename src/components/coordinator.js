

/**
 *  Coordinator for browser-side interface
 */
MW.Coordinator = function(nWorkersInput, workerScriptName, logLevel) {
	var that = this;
	var objectBuffer = {};
	var messageBuffer = [];
	var walltime = 0;
	var logLevel = logLevel || 2;
	log.setLevel("coord", logLevel);

	// Create the worker pool, which starts the workers
	pool.create(nWorkersInput, workerScriptName, logLevel);

	this.getBuffer = function() {
		return objectBuffer;
	}

	this.getMessages = function() {
		return messageBuffer;
	}

	this.getWallTime = function() {
		return walltime;
	}

	this.trigger = function(tag) {
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			pool.getWorker(wk).postMessage({handle: "trigger", tag: tag});
		}
	}

	this.sendVectorToWorkers = function(vec, tag) {
		// Must make a copy of the vector for each worker for transferrable object message passing
		for (var wk = 0; wk < pool.getNumWorkers(); ++wk) {
			var v = new Float64Array(vec.getArray());
			pool.getWorker(wk).postMessage({handle: "vectorBroadcast", tag: tag, 
				vec: v.buffer}, [v.buffer]);
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
 			case "vectorParts":
 				handleVectorParts(data);
 				break;
  			case "vectorNorm":
 				handleVectorNorm(data);
 				break;
  			case "vectorSum":
 				handleVectorSum(data);
 				break;
 			case "matrixSendToCoordinator":
 				handleMatrixSendToCoordinator(data);
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
 	var vectorParts = {};

 	var handleWorkerReady = function() {
 		nWorkersReported += 1;
 		if (nWorkersReported == pool.getNumWorkers()) {
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
		walltime = util.deltaTime(data.time);
		that.emit(data.tag);
	}

	var handleMatrixSendToCoordinator = function(data) {
		var tmp = [];
		for (var i = 0; i < data.nrows; ++i) {
			tmp.push(new Float64Array(data[i]));
		}
		objectBuffer = new MW.Matrix();
		objectBuffer.setMatrix(tmp);
		walltime = util.deltaTime(data.time);
		that.emit(data.tag);
	}

	var handleVectorParts = function(data) {
		// Reduce the vector part from each worker
		// Collect each worker's part into an array
		var id = data.id;
		vectorParts[id] = new Float64Array(data.vectorPart);
		tot += data.len;

		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// build the full vector and save to buffer
			objectBuffer = new MW.Vector();
			objectBuffer.setVector(buildVectorFromParts(vectorParts, tot));

			// walltime
			walltime = util.deltaTime(data.time);

			// emit and reset
			that.emit(data.tag);
			nWorkersReported = 0;
			tot = 0;
			vectorParts = {};
		}
	}

	var buildVectorFromParts = function(vectorParts, totalLength) {
		var vec = new Float64Array(totalLength);
		var offset = 0;
		for (var i = 0; i < pool.getNumWorkers(); ++i) {
			for (var j = 0; j < vectorParts[i].length; ++j) {
				vec[offset + j] = vectorParts[i][j];
			}
			offset += vectorParts[i].length;
		}
		return vec;
	}

	var handleVectorNorm = function(data) {
		tot += data.tot;
		nWorkersReported += 1;
		if (nWorkersReported == pool.getNumWorkers()) {
			// save result to buffer and emit to the browser-side coordinator
			objectBuffer = Math.sqrt(tot);
			that.emit(data.tag);

			// wall time
			walltime = util.deltaTime(data.time);

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
			that.emit(data.tag);

			// wall time
			walltime = util.deltaTime(data.time);

			// reset for next message
			nWorkersReported = 0;
			tot = 0.0;
		}
	}

}
MW.Coordinator.prototype = new EventEmitter();
