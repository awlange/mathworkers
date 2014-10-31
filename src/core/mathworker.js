// Copyright 2014 Adrian W. Lange

/**
 * MathWorker for worker-side interface.
 * Manages computations and message passing for a web worker in the worker pool.
 *
 * @constructor
 */
MW.MathWorker = function() {

	/**
	 * Buffer for data received from the coordinator
	 *
	 * @type {Object}
	 * @private
	 */
 	var objectBuffer = {};

	/**
	 * An object mapping an event tag key to a registered callback value
	 *
	 * @type {Object}
	 * @private
	 */
 	var triggers = {};

	/**
	 * Retrieve the id number of the MathWorker
	 *
	 * @returns {number} the id of the MathWorker
	 */
 	this.getId = function() {
 		return global.myWorkerId;
 	};

	/**
	 * Retrieve the size (number of workers) in the worker pool
	 *
	 * @returns {number} the size of the worker pool
	 */
 	this.getNumWorkers = function() {
 		return global.nWorkers;
 	};

	/**
	 * Fetches the object buffer contents.
	 * After a message from the coordinator is received, the object
	 * buffer is typically populated with data.
	 *
	 * @returns {Object}
	 */
	this.getBuffer = function() {
		return objectBuffer;
	};

	/**
	 * Register an event with a callback to be executed when the coordinator triggers the event
	 *
	 * @param {!string} tag the unique label for the event being registered
	 * @param {function} callback the callback function to be registered
	 */
	this.on = function(tag, callback) {
		if (global.logLevel > 2) {
			console.log("registering trigger: " + tag);
		}
		triggers[tag] = [callback];
	};

	/**
	 * Send data to the coordinator
	 *
	 * @param {Object} data JSON-serializable data to be sent to coordinator
	 * @param {!string} tag message tag
	 */
 	this.sendDataToCoordinator = function(data, tag) {
 		self.postMessage({handle: "_sendData", id: global.myWorkerId, tag: tag, data: data});
 	};

	/**
	 * Send a Vector to the coordinator
	 *
	 * @param {MW.Vector} vec the Vector to be sent
	 * @param {!string} tag message tag
	 */
    this.sendVectorToCoordinator = function(vec, tag) {
        // only id 0 does the sending actually
        if (global.myWorkerId == 0) {
            self.postMessage({handle: "_vectorSendToCoordinator", tag: tag,
                vectorBuffer: vec.array.buffer}, [vec.array.buffer]);
        }
    };

	/**
	 * Send a Matrix to the coordinator
	 *
	 * @param {MW.Matrix} mat the Matrix to be sent
	 * @param {!string} tag message tag
	 */
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

	/**
	 * onmessage event router.
	 * Route the event appropriately based on the event data.
	 *
	 * @param {Object} event web worker event object
	 * @private
	 */
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
 				console.error("Invalid MathWorker handle: " + data.handle);
 		}
 	};

	/**
	 * MathWorker initialization. This message is received upon the coordinator creating this worker for
	 * the worker pool in MW.global.createPool().
	 * Sets various internal variables for this worker, and then sends a ready message to the coordinator.
	 *
	 * @param {Object} data message data
	 * @private
	 */
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

	/**
	 * When the coordinator issues a trigger message, execute the registered callback corresponding to the message tag.
	 *
	 * @param {Object} data message data
	 * @param {Object} [obj] optional object to pass as an argument to the callback
	 * @private
	 */
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

	/**
	 * Place broadcast data from coordinator into the objectBuffer.
	 * Then, trigger the corresponding event.
	 *
	 * @param {Object} data message data
	 * @private
	 */
 	var handleBroadcastData = function(data) {
 		objectBuffer = data.data;
 		handleTrigger(data);
 	};


	/**
	 * Place broadcast Vector from coordinator into the objectBuffer.
	 * Then, trigger the corresponding event.
	 *
	 * @param {Object} data message data
	 * @private
	 */
 	var handleBroadcastVector = function(data) {
 		objectBuffer = MW.Vector.fromArray(new Float64Array(data.vec));
 		handleTrigger(data, objectBuffer);
 	};

	/**
	 * Place broadcast Matrix from coordinator into the objectBuffer.
	 * Then, trigger the corresponding event.
	 *
	 * @param {Object} data message data
	 * @private
	 */
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


/*
 * MathWorker internal static-like functions
 */

/**
 * Prepare and send a Vector to the coordinator via message passing
 *
 * @param {!Float64Array} vec the Vector to be gathered. Each worker is responsible for a different section.
 * @param {!number} totalLength the total length of the gathered Vector
 * @param {!number} offset the offset to use in the gather for this worker's Vector section
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, have the coordinator broadcast the gathered Vector back to all workers,
 *                                stored in their objectBuffers. Otherwise, the gathered Vector remains in the
 *                                coordinator objectBuffer.
 * @private
 */
MW.MathWorker.gatherVector = function(vec, totalLength, offset, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_gatherVector", tag: tag, id: global.myWorkerId, rebroadcast: rebroadcast,
        len: totalLength, offset: offset, vectorPart: vec.buffer}, [vec.buffer]);
};

/**
 * Prepare and send a Matrix by rows to the coordinator via message passing
 *
 * @param {!Array.<Float64Array>} mat the Matrix to be gathered by rows. Each worker is responsible for different rows.
 * @param {!number} totalRows the total number of rows in the gathered Matrix
 * @param {!number} offset the row offset to use in the gather for this worker's Matrix rows
 * @param {!string} tag message tag
 * @param {boolean} rebroadcast If true, have the coordinator broadcast the gathered Matrix back to all workers,
 *                              stored in their objectBuffers. Otherwise, the gathered Matrix remains in the
 *                              coordinator objectBuffer.
 * @private
 */
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

/**
 * Prepare and send a Matrix by columns to the coordinator via message passing
 *
 * @param {!Array.<Float64Array>} mat the Matrix to be gathered by columns. Each worker is responsible for different columns.
 * @param {!number} totalRows the total number of rows in the gathered Matrix
 * @param {!number} totalCols the total number of columns in the gathered Matrix
 * @param {!number} offset the column offset to use in the gather for this worker's Matrix columns
 * @param {!string} tag message tag
 * @param {boolean} rebroadcast If true, have the coordinator broadcast the gathered Matrix back to all workers,
 *                              stored in their objectBuffers. Otherwise, the gathered Matrix remains in the
 *                              coordinator objectBuffer.
 * @private
 */
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

/**
 * Prepare and send a number total for a Vector reduction summation
 *
 * @param {!number} tot this worker's sum to be reduced
 * @param {!string} tag message tag
 * @param {boolean} rebroadcast If true, have the coordinator broadcast the reduced sum back to all workers,
 *                              stored in their objectBuffers. Otherwise, the reduced sum remains in the
 *                              coordinator objectBuffer.
 */
MW.MathWorker.reduceVectorSum = function(tot, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_vectorSum", tag: tag, rebroadcast: rebroadcast, tot: tot});
};


/**
 * Prepare and send a number total for a Vector reduction product
 *
 * @param {!number} tot this worker's product to be reduced
 * @param {!string} tag message tag
 * @param {boolean} rebroadcast If true, have the coordinator broadcast the reduced product back to all workers,
 *                              stored in their objectBuffers. Otherwise, the reduced product remains in the
 *                              coordinator objectBuffer.
 */
MW.MathWorker.reduceVectorProduct = function(tot, tag, rebroadcast) {
    rebroadcast = rebroadcast || false;
    self.postMessage({handle: "_vectorProduct", tag: tag, rebroadcast: rebroadcast, tot: tot});
};


