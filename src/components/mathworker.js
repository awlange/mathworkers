
/**
 *  MathWorker for worker-side interface
 */
MW.MathWorker = function() {
 	var id;
 	var nWorkers;
 	var objectBuffer = {};
 	var triggers = {};

 	this.getId = function() {
 		return id;
 	};

 	this.getNumWorkers = function() {
 		return nWorkers;
 	};

	this.getBuffer = function() {
		return objectBuffer;
	};

	this.newVector = function(size) {
		return new MW.Vector(size, id, nWorkers);
	};

	this.newVectorFromArray = function(arr) {
		return MW.Vector.fromArray(arr, id, nWorkers);
	};

	this.newMatrix = function(nrows, ncols) {
		return new MW.Matrix(nrows, ncols, id, nWorkers);
	};

	this.newMatrixFromArray = function(arr) {
		return MW.Matrix.fromArray(arr, id, nWorkers);
	};

 	this.sendDataToCoordinator = function(data, tag) {
 		self.postMessage({handle: "_sendData", id: id, tag: tag, data: data});
 	};

 	// Route the message appropriately for the Worker
	self.onmessage = function(event) {
		var data = event.data;
		switch (data.handle) {
			case "_init":
				handleInit(data);
				break;
			case "_trigger":
				handleTrigger(data);
				break;
			case "_broadcastData":
				handleBroadcastData(data);
				break;
			case "_broadcastVector":
				handleBroadcastVector(data);
				break;
			case "_broadcastMatrix":
				handleBroadcastMatrix(data);
				break;
 			default:
 				log.error("Invalid MathWorker handle: " + data.handle);
 		}
 	};

 	// registers the callback for a trigger
 	this.on = function(tag, callback) {
        log.debug("registering trigger: " + tag);
        triggers[tag] = [callback];
    };

 	var handleInit = function(data) {
 		id = data.id;
 		nWorkers = data.nWorkers;
 		log.setLevel("w" + id, data.logLevel);
 		log.debug("Initialized MathWorker: " + id + " of " + nWorkers + " workers.");
 		self.postMessage({handle: "_workerReady"});
 	};

 	var handleTrigger = function(data, obj) {
		if (data.tag in triggers) {
			triggers[data.tag] = triggers[data.tag] || [];
			args = data.data || obj || [];
			triggers[data.tag].forEach( function(fn) {
				fn.call(this, args);
			});
		} else {
			log.error("Unregistered trigger tag: " + data.tag);
		}
 	};

 	var handleBroadcastData = function(data) {
 		objectBuffer = data.data;
 		handleTrigger(data);
 	};

 	var handleBroadcastVector = function(data) {
 		objectBuffer = MW.Vector.fromArray(new Float64Array(data.vec));
 		handleTrigger(data, objectBuffer);
 	};

 	var handleBroadcastMatrix = function(data) {
 		var tmp = [];
		for (var i = 0; i < data.nrows; ++i) {
			tmp.push(new Float64Array(data[i]));
		}
		objectBuffer = new MW.Matrix();
		objectBuffer.setMatrix(tmp);
 		handleTrigger(data, objectBuffer);
 	};
};
MW.MathWorker.prototype = new EventEmitter();


/**
 * MathWorker static-like functions
 */
MW.MathWorker.gatherVector = function(vec, tag, id, rebroadcast) {
    self.postMessage({handle: "_gatherVector", tag: tag, id: id, rebroadcast: rebroadcast,
        len: vec.length, vectorPart: vec.buffer}, [vec.buffer]);
};

MW.MathWorker.gatherMatrix = function(mat, offset, tag, id, rebroadcast) {
    var matObject = {handle: "_gatherMatrix", tag: tag, id: id, rebroadcast: rebroadcast,
        nrows: mat.length, offset: offset};
    var matBufferList = [];
    for (var i = 0; i < mat.length; ++i) {
        matObject[i] = mat[i].buffer;
        matBufferList.push(mat[i].buffer);
    }
    self.postMessage(matObject, matBufferList);
};

MW.MathWorker.reduceVectorNorm = function(tot, tag, rebroadcast) {
    self.postMessage({handle: "_vectorNorm", tag: tag, rebroadcast: rebroadcast, tot: tot});
};

MW.MathWorker.reduceVectorSum = function(tot, tag, rebroadcast) {
    self.postMessage({handle: "_vectorSum", tag: tag, rebroadcast: rebroadcast, tot: tot});
};


