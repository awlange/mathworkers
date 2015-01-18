// Copyright 2014 Adrian W. Lange

/**
 * Coordinator for browser-side interface.
 * Coordinates the pool of Workers for computations and message passing.
 *
 * @param {!number} nWorkersInput the number of Workers to spawn in the pool
 * @param {!string} workerScriptName the name of the script that the Workers are to execute
 * @constructor
 * @mixes EventEmitter
 * @memberof MathWorkers
 */
MathWorkers.Coordinator = function(nWorkersInput, workerScriptName) {
    var that = this;

    /**
     * Buffer for data received from worker pool
     *
     * @member {Object}
     * @private
     */
    var objectBuffer = {};

    /**
     * Message buffer for messages received from worker pool. Order of
     * messages in array corresponds to the MathWorker id.
     *
     * @member {Array}
     * @private
     */
    var messageDataBuffer = [];

    /**
     * True when all spawned workers have reported that they are ready. False otherwise.
     *
     * @member {boolean}
     */
    this.ready = false;

    /**
     * Once all workers in the pool report that they are ready, execute the callback.
     *
     * @param {function} callBack callback function to be executed
     */
    this.onReady = function(callBack) {
        that.on("_ready", callBack);
    };

    /**
     * Fetches the object buffer contents.
     * After a message from one or more workers is received, the object
     * buffer is typically populated with data.
     *
     * @returns {Object}
     */
    this.getBuffer = function() {
        return objectBuffer;
    };

    /**
     * Fetches the message data list contents.
     * After a message from one or more workers is received, the object
     * buffer is usually populated with data.
     *
     * @returns {Array}
     */
    this.getMessageDataList = function() {
        return messageDataBuffer;
    };

    /**
     * Cause an event registered by the MathWorker pool to execute.
     *
     * @param {!string} tag the unique label for the event being triggered
     * @param {Array} [args] an array of arguments to be passed to the callback to be executed
     */
    this.trigger = function(tag, args) {
        for (var wk = 0; wk < global.nWorkers; ++wk) {
            comm.postMessageToWorker(wk, {handle: "_trigger", tag: tag, args: args});
        }
    };

    /**
     * Broadcasts data to all workers
     *
     * @param {Object} data JSON-serializable data to be sent
     * @param {!string} tag message tag
     */
    this.sendDataToWorkers = function(data, tag) {
        for (var wk = 0; wk < global.nWorkers; ++wk) {
            comm.postMessageToWorker(wk, {handle: "_broadcastData", tag: tag, data: data});
        }
    };

    /**
     * Broadcast a Vector to all workers
     *
     * @param {!MathWorkers.Vector} vec Vector to be sent
     * @param {!string} tag message tag
     */
    this.sendVectorToWorkers = function(vec, tag) {
        // Must make a copy of the vector for each worker for transferable object message passing
        for (var wk = 0; wk < global.nWorkers; ++wk) {
            var buf;
            if (global.isNode) {
                // Convert ArrayBuffer to string
                buf = MathWorkers.util.ab2str(vec.array.buffer);
            } else {
                var v = new Float64Array(vec.array);
                buf = v.buffer;
            }
            comm.postMessageToWorker(wk, {handle: "_broadcastVector", tag: tag,	vec: buf}, [buf]);
        }
    };

    /**
     * Broadcast a Matrix to all workers
     *
     * @param {!MathWorkers.Matrix} mat Matrix to be sent
     * @param {!string} tag message tag
     */
    this.sendMatrixToWorkers = function(mat, tag) {
        // Must make a copy of each matrix row for each worker for transferable object message passing
        for (var wk = 0; wk < global.nWorkers; ++wk) {
            var matObject = {handle: "_broadcastMatrix", tag: tag, nrows: mat.nrows};
            var matBufferList = [];
            var i, row;
            if (global.isNode) {
                for (i = 0; i < mat.nrows; ++i) {
                    // Convert ArrayBuffer to string
                    matObject[i] = MathWorkers.util.ab2str(mat.array[i].buffer);
                }
            } else {
                for (i = 0; i < mat.nrows; ++i) {
                    row = new Float64Array(mat.array[i]);
                    matObject[i] = row.buffer;
                    matBufferList.push(row.buffer);
                }
            }
            comm.postMessageToWorker(wk, matObject, matBufferList);
        }
    };

    /**
     * Disconnect the coordinator from node.js cluster workers
     */
    this.disconnect = function() {
        if (global.isNode && global.nodeCluster.isMaster) {
            global.nodeCluster.disconnect();
        }
    };

    /**
     * Create the worker pool, which starts the workers
     */
    global.createPool(nWorkersInput, workerScriptName);

    /**
     * The onmessage router for all workers.
     * Routes the event appropriately based on the message handle.
     *
     * @param event {Object} web worker event from message passing
     * @private
     */
    var onmessageHandler = function(event) {
        var data = event.data || event;
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
            case "_gatherMatrixRows":
                handleGatherMatrixRows(data);
                break;
            case "_gatherMatrixColumns":
                handleGatherMatrixColumns(data);
                break;
            case "_vectorSum":
                handleVectorSum(data);
                break;
            case "_vectorProduct":
                handleVectorProduct(data);
                break;
            default:
                console.error("Invalid Coordinator handle: " + data);
        }
    };

    // Register the above onmessageHandler for each worker in the pool
    // Also, initialize the message data buffer with empty objects
    for (var wk = 0; wk < global.nWorkers; ++wk) {
        if (global.isNode) {
            // Node.js cluster workers
            if (global.nodeCluster.isWorker) {
                return;
            }
            global.getWorker(wk).on("message", onmessageHandler);
        } else {
            // HTML5 Web Workers
            global.getWorker(wk).onmessage = onmessageHandler;
        }
        messageDataBuffer.push({});
    }

    // Reduction function variables
    var nWorkersReported = 0;

    /**
     * Accumulate the number of reported workers. Once all workers have reported,
     * emit the special "_ready" event to cause onReady() to execute.
     *
     * @private
     */
    var handleWorkerReady = function() {
        nWorkersReported += 1;
        if (nWorkersReported === global.nWorkers) {
            that.ready = true;
            that.emit("_ready");
            // reset for next message
            nWorkersReported = 0;
        }
    };

    /**
     * Accumulate messages from workers into the messageDataBuffer array.
     * Emits the message tag event.
     *
     * @param data {!Object} message data
     * @private
     */
    var handleSendData = function(data) {
        messageDataBuffer[data.id] = data.data;
        nWorkersReported += 1;
        if (nWorkersReported === global.nWorkers) {
            that.emit(data.tag);
            // reset for next message
            nWorkersReported = 0;
        }
    };

    /**
     * Copies Vector sent from a worker into a Vector stored
     * temporarily in the Coordinator objectBuffer.
     * Emits the message tag event.
     *
     * @param data {!Object} message data
     * @private
     */
    var handleVectorSendToCoordinator = function(data) {
        objectBuffer = new MathWorkers.Vector();
        var buf = data.vectorBuffer;
        if (global.isNode) {
            // Convert string into ArrayBuffer
            buf = MathWorkers.util.str2ab(buf);
        }
        objectBuffer.setVector(new Float64Array(buf));
        that.emit(data.tag);
    };

    /**
     * Copies Matrix sent from a worker into a Matrix stored
     * temporarily in the Coordinator objectBuffer.
     * Emits the message tag event.
     *
     * @param data {!Object} message data
     * @private
     */
    var handleMatrixSendToCoordinator = function(data) {
        var i, tmp = [];
        if (global.isNode) {
            for (i = 0; i < data.nrows; ++i) {
                // Convert string into ArrayBuffer
                tmp.push(new Float64Array(MathWorkers.util.str2ab(data[i])));
            }
        } else {
            for (i = 0; i < data.nrows; ++i) {
                tmp.push(new Float64Array(data[i]));
            }
        }
        objectBuffer = new MathWorkers.Matrix();
        objectBuffer.setMatrix(tmp);
        that.emit(data.tag);
    };

    /**
     * Gather Vector parts from workers into a new Vector stored in the
     * Coordinator objectBuffer.
     * Emits the message tag event.
     *
     * @param data {!Object} message data
     * @private
     */
    var handleGatherVector = function(data) {
        // Gather the vector parts from each worker
        if (nWorkersReported === 0) {
            objectBuffer = new MathWorkers.Vector(data.len);
        }
        var buf = global.isNode ? MathWorkers.util.str2ab(data.vectorPart) : data.vectorPart;
        var tmpArray = new Float64Array(buf);
        var offset = data.offset;
        for (var i = 0; i < tmpArray.length; ++i) {
            objectBuffer.array[offset + i] = tmpArray[i];
        }

        nWorkersReported += 1;
        if (nWorkersReported === global.nWorkers) {
            if (data.rebroadcast) {
                that.sendVectorToWorkers(objectBuffer, data.tag);
            } else {
                that.emit(data.tag);
            }
            // reset
            nWorkersReported = 0;
        }
    };

    /**
     * Gather Matrix rows from workers into a new Matrix stored in the
     * Coordinator objectBuffer.
     * Emits the message tag event.
     *
     * @param data {!Object} message data
     * @private
     */
    var handleGatherMatrixRows = function(data) {
        // Gather the matrix rows from each worker
        var i, offset = data.offset;
        if (nWorkersReported === 0) {
            objectBuffer = new MathWorkers.Matrix(data.nrows, data.ncols);
        }
        if (global.isNode) {
            for (i = 0; i < data.nrowsPart; ++i) {
                objectBuffer.array[offset + i] = new Float64Array(MathWorkers.util.str2ab(data[i]));
            }
        } else {
            for (i = 0; i < data.nrowsPart; ++i) {
                objectBuffer.array[offset + i] = new Float64Array(data[i]);
            }
        }

        nWorkersReported += 1;
        if (nWorkersReported === global.nWorkers) {
          // build the full vector and save to buffer
          if (data.rebroadcast) {
              that.sendMatrixToWorkers(objectBuffer, data.tag);
          } else {
              that.emit(data.tag);
          }
          //reset
          nWorkersReported = 0;
        }
    };

    /**
     * Gather Matrix columns from workers into a new Matrix stored in the
     * Coordinator objectBuffer.
     * Emits the message tag event.
     *
     * @param data {!Object} message data
     * @private
     */
    var handleGatherMatrixColumns = function(data) {
        // Gather the matrix columns from each worker
        var i, k;
        if (nWorkersReported === 0) {
            objectBuffer = new MathWorkers.Matrix(data.nrows, data.ncols);
        }

        // array in data is transposed
        var tmpArray;
        var offsetk;
        if (global.isNode) {
            for (k = 0, offsetk = data.offset; k < data.nrowsPart; ++k, ++offsetk) {
              tmpArray = new Float64Array(MathWorkers.util.str2ab(data[k]));
              for (i = 0; i < tmpArray.length; ++i) {
                  objectBuffer.array[i][offsetk] = tmpArray[i];
              }
            }
        } else {
            for (k = 0, offsetk = data.offset; k < data.nrowsPart; ++k, ++offsetk) {
                tmpArray = new Float64Array(data[k]);
                for (i = 0; i < tmpArray.length; ++i) {
                    objectBuffer.array[i][offsetk] = tmpArray[i];
                }
            }
        }

        nWorkersReported += 1;
        if (nWorkersReported === global.nWorkers) {
            if (data.rebroadcast) {
                that.sendMatrixToWorkers(objectBuffer, data.tag);
            } else {
                // emit
                that.emit(data.tag);
            }
            //reset
            nWorkersReported = 0;
        }
    };

    /**
     * Sum reduction for a Vector. Stores the full sum in the objectBuffer.
     * Emits the message tag event.
     *
     * @param data {!Object}
     * @private
     */
    var handleVectorSum = function(data) {
        if (nWorkersReported === 0) {
            objectBuffer = data.tot;
        } else {
            objectBuffer += data.tot;
        }
        nWorkersReported += 1;
        if (nWorkersReported === global.nWorkers) {
            if (data.rebroadcast) {
                // rebroadcast the result back to the workers
                that.sendDataToWorkers(objectBuffer, data.tag);
            } else {
                // save result to buffer and emit to the browser-side coordinator
                that.emit(data.tag);
            }
            // reset for next message
            nWorkersReported = 0;
        }
    };

    /**
     * Product reduction for a Vector. Stores the full product in the objectBuffer.
     * Emits the message tag event.
     *
     * @param data {!Object}
     * @private
     */
    var handleVectorProduct = function(data) {
        if (nWorkersReported === 0) {
            objectBuffer = data.tot;
        } else {
            objectBuffer *= data.tot;
        }
        nWorkersReported += 1;
        if (nWorkersReported === global.nWorkers) {
            if (data.rebroadcast) {
                // rebroadcast the result back to the workers
                that.sendDataToWorkers(objectBuffer, data.tag);
            } else {
                // save result to buffer and emit to the browser-side coordinator
                that.emit(data.tag);
            }
            // reset for next message
            nWorkersReported = 0;
        }
    };
};
MathWorkers.Coordinator.prototype = new EventEmitter();

