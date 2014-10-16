// Copyright 2014 Adrian W. Lange

/**
 *  MathWorker for worker-side interface
 */
MW.MathWorker = function() {
 	var objectBuffer = {};
 	var triggers = {};

 	this.getId = function() {
 		return global.myWorkerId;
 	};

 	this.getNumWorkers = function() {
 		return global.nWorkers;
 	};

	this.getBuffer = function() {
		return objectBuffer;
	};

 	this.sendDataToCoordinator = function(data, tag) {
 		self.postMessage({handle: "_sendData", id: global.myWorkerId, tag: tag, data: data});
 	};

    this.sendVectorToCoordinator = function(vec, tag) {
        // only id 0 does the sending actually
        if (global.myWorkerId == 0) {
            self.postMessage({handle: "_vectorSendToCoordinator", tag: tag,
                vectorBuffer: vec.array.buffer}, [vec.array.buffer]);
        }
    };

    this.sendMatrixToCoordinator = function(mat, tag) {
        // only id 0 does the sending actually
        if (id == 0) {
            var matObject = {handle: "_matrixSendToCoordinator", tag: tag, nrows: mat.nrows};
            var matBufferList = [];
            for (var i = 0; i < mat.nrows; ++i) {
                matObject[i] = mat.array[i].buffer;
                matBufferList.push(mat.array[i].buffer);
            }
            self.postMessage(matObject, matBufferList);
        }
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
        if (global.logLevel > 2) {
            console.log("registering trigger: " + tag);
        }
        triggers[tag] = [callback];
    };

 	var handleInit = function(data) {
        global.myWorkerId = data.id;
        global.nWorkers = data.nWorkers;
        global.unrollLoops = data.unrollLoops;
        global.logLevel = data.logLevel;
 		if (global.logLevel > 2) {
            console.log("Initialized MathWorker: " + global.myWorkerId + " of " + global.nWorkers + " workers.");
        }
        self.postMessage({handle: "_workerReady"});
 	};

 	var handleTrigger = function(data, obj) {
		if (triggers[data.tag]) {
			triggers[data.tag] = triggers[data.tag] || [];
			var args = data.data || obj || [];
			triggers[data.tag].forEach( function(fn) {
				fn.call(this, args);
			});
		} else {
			console.error("Unregistered trigger tag: " + data.tag);
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
MW.MathWorker.gatherVector = function(vec, totalLength, offset, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_gatherVector", tag: tag, id: global.myWorkerId, rebroadcast: rebroadcast,
        len: totalLength, offset: offset, vectorPart: vec.buffer}, [vec.buffer]);
};

MW.MathWorker.gatherMatrixRows = function(mat, totalRows, offset, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    var matObject = {handle: "_gatherMatrixRows", tag: tag, id: global.myWorkerId, rebroadcast: rebroadcast,
        nrows: totalRows, ncols: mat[0].length, nrowsPart: mat.length, offset: offset};
    var matBufferList = [];
    for (var i = 0; i < mat.length; ++i) {
        matObject[i] = mat[i].buffer;
        matBufferList.push(mat[i].buffer);
    }
    self.postMessage(matObject, matBufferList);
};

MW.MathWorker.gatherMatrixColumns = function(mat, totalRows, totalCols, offset, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    var matObject = {handle: "_gatherMatrixColumns", tag: tag, id: global.myWorkerId, rebroadcast: rebroadcast,
        nrows: totalRows, ncols: totalCols, nrowsPart: mat.length, offset: offset};
    var matBufferList = [];
    for (var i = 0; i < mat.length; ++i) {
        matObject[i] = mat[i].buffer;
        matBufferList.push(mat[i].buffer);
    }
    self.postMessage(matObject, matBufferList);
};

MW.MathWorker.reduceVectorNorm = function(tot, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_vectorNorm", tag: tag, rebroadcast: rebroadcast, tot: tot});
};

MW.MathWorker.reduceVectorSum = function(tot, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_vectorSum", tag: tag, rebroadcast: rebroadcast, tot: tot});
};


