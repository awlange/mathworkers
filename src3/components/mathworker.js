
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

 	this.sendText = function(tag, message) {
 		self.postMessage({handle: "textFromWorker", id: id, tag: tag, text: message});
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
			case "vectorBroadcast":
				handleVectorBroadcast(data);
				break;
 			default:
 				log.error("Invalid MathWorker handle: " + data.handle);
 		}
 	}

 	// registers the callback for a trigger
 	this.on = function(tag, callback) {
        log.debug("registering trigger: " + tag);
        triggers[tag] = triggers[tag] || [];
        triggers[tag].push(callback);
    }

 	var handleInit = function(data) {
 		id = data.id;
 		nWorkers = data.nWorkers;
 		log.setLevel("w" + id, data.logLevel);
 		log.debug("Initialized MathWorker: " + id + " of " + nWorkers + " workers.");
 		self.postMessage({handle: "workerReady"});
 	}

 	var handleTrigger = function(data) {
		if (data.tag in triggers) {
			triggers[data.tag] = triggers[data.tag] || [];
			triggers[data.tag].forEach( function(fn) {
				fn.call(this);
			});
		} else {
			log.error("Unregistered trigger tag: " + data.tag);
		}
 	}

 	var handleVectorBroadcast = function(data) {
 		objectBuffer = MW.Vector.fromArray(new Float64Array(data.vec));
 		handleTrigger(data);
 	}
}
MW.Coordinator.prototype = new EventEmitter();

