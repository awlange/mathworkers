
/**
 *  MathWorker for worker-side interface
 */
MW.MathWorker = function() {
	var that = this;
 	var id;
 	var nWorkers;
 	var objectBuffer = {};
 	var logLevel = 2;
 	var triggers = {};

 	this.getId = function() {
 		return id;
 	}

 	this.getNumWorkers = function() {
 		return nWorkers;
 	}

	this.getBuffer = function() {
		return objectBuffer;
	}

	this.newVector = function(size) {
		return new MW.Vector(size, id, nWorkers);
	}

	this.newVectorFromArray = function(arr) {
		return MW.Vector.fromArray(arr, id, nWorkers);
	}

	this.newMatrix = function(nrows, ncols) {
		return new MW.Matrix(nrows, ncols, id, nWorkers);
	}

	this.newMatrixFromArray = function(arr) {
		return MW.Matrix.fromArray(arr, id, nWorkers);
	}

 	this.sendDataToCoordinator = function(data, tag) {
 		self.postMessage({handle: "sendData", id: id, tag: tag, data: data});
 	}

 	// Route the message appropriately for the Worker
	self.onmessage = function(event) {
		var data = event.data;
		switch (data.handle) {
			case "init":
				handleInit(data);
				break;
			case "trigger":
				handleTrigger(data);
				break;
			case "broadcastData":
				handleBroadcastData(data);
				break;
			case "broadcastVector":
				handleBroadcastVector(data);
				break;
			case "broadcastMatrix":
				handleBroadcastMatrix(data);
				break;
 			default:
 				log.error("Invalid MathWorker handle: " + data.handle);
 		}
 	}

 	// registers the callback for a trigger
 	this.on = function(tag, callback) {
        log.debug("registering trigger: " + tag);
        triggers[tag] = [callback];
    }

 	var handleInit = function(data) {
 		id = data.id;
 		nWorkers = data.nWorkers;
 		log.setLevel("w" + id, data.logLevel);
 		log.debug("Initialized MathWorker: " + id + " of " + nWorkers + " workers.");
 		self.postMessage({handle: "workerReady"});
 	}

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
 	}

 	var handleBroadcastData = function(data) {
 		objectBuffer = data.data;
 		handleTrigger(data);
 	}

 	var handleBroadcastVector = function(data) {
 		objectBuffer = MW.Vector.fromArray(new Float64Array(data.vec));
 		handleTrigger(data, objectBuffer);
 	}

 	var handleBroadcastMatrix = function(data) {
 		var tmp = [];
		for (var i = 0; i < data.nrows; ++i) {
			tmp.push(new Float64Array(data[i]));
		}
		objectBuffer = new MW.Matrix();
		objectBuffer.setMatrix(tmp);
 		handleTrigger(data, objectBuffer);
 	}
}
MW.Coordinator.prototype = new EventEmitter();

