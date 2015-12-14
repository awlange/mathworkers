(function() {
"use strict";

/**
 * The MathWorkers namespace that everything hangs off of
 *
 * @namespace MathWorkers
 */
var MathWorkers = {};


(function() {

    // Enum-like object of the allowed data types for MathWorkers
    MathWorkers.Datatype = Object.freeze({
        Float32: "Float32",
        Float64: "Float64"
    });

}());


/**
 * Custom event emitter. To be inherited by classes involving events.
 * Based on example provided here:
 *
 * http://otaqui.com/blog/1374/event-emitter-pub-sub-or-deferred-promises-which-should-you-choose/
 *
 * @mixin
 */
(function() {
    MathWorkers.EventEmitter = function() {
        var events = {};

        /**
         * Sets an event to listen for
         *
         * @param {!string} name the event name
         * @param {function} callback the callback to be executed when the event is emitted
         */
        this.on = function(name, callback) {
            events[name] = [callback];
            return this;
        };

        /**
         * Emits an event and executes the corresponding callback
         *
         * @param {!string} name the event name
         * @param {Array.<Object>} [args] an array of arguments to be passed to the callback
         */
        this.emit = function(name, args) {
            events[name] = events[name] || [];
            args = args || [];
            events[name].forEach(function (fn) {
                fn.call(this, args);
            });
            return this;
        };
    }
}());



(function() {

    MathWorkers.util = new function() {

        /**
         * Verify that the environment executing this code has Web Worker support
         *
         * @ignore
         * @throws {Error}
         */
        this.checkWebWorkerSupport = function () {
            if (typeof(Worker) === "undefined") {
                throw new Error("Web Worker support not available for MathWorkers.");
            }
        };

        /**
         * Load balancing function.
         * Divides n up evenly among the specified number of workers.
         * Any remainder is distributed such that no worker has more than 1 extra piece in its range.
         *
         * @ignore
         * @returns {object} container for range index from (inclusive) and index to (non-inclusive) for the given id
         */
        this.loadBalance = function(n, nWorkers, id) {
            id = id || 0;
            var div = (n / nWorkers) | 0;
            var rem = n % nWorkers;

            var ifrom;
            var ito;
            if (id < rem) {
                ifrom = id * (div + 1);
                ito = ifrom + div + 1;
            } else {
                ifrom = id * div + rem;
                ito = ifrom + div;
            }

            return {ifrom: ifrom, ito: ito};
        };

        /**
         * Create a new typed array of given size and data type
         */
        this.newTypedArray = function(length, datatype) {
            switch (datatype) {
                case MathWorkers.Datatype.Float32:
                    return new Float32Array(length);
                case MathWorkers.Datatype.Float64:
                    return new Float64Array(length);
                default:
                    return null;
            }
        };

        /**
         * Create a copy of a provided typed array
         */
        this.copyTypedArray = function(arr, datatype) {
            switch (datatype) {
                case MathWorkers.Datatype.Float32:
                    return new Float32Array(arr);
                case MathWorkers.Datatype.Float64:
                    return new Float64Array(arr);
                default:
                    return null;
            }
        };
    };

}());


(function() {

    MathWorkers.Vector = function(length, datatype) {
        this.datatype = datatype || MathWorkers.Datatype.Float32;
        this.length = length || 0;
        this.array = null;
        if (this.length > 0) {
            this.array = MathWorkers.util.newTypedArray(this.length, this.datatype);
        }
    };

    MathWorkers.Vector.fromArray = function(array, datatype) {
        var tmpArray = MathWorkers.util.copyTypedArray(array, datatype)
        var tmp = new MathWorkers.Vector(0, datatype);
        tmp.length = tmpArray.length;
        tmp.array = tmpArray;
        return tmp;
    };

    MathWorkers.Vector.zeros = function(length, datatype) {
        var vec = new MathWorkers.Vector(length, datatype);
        for (var i = 0; i < length; ++i) {
            vec.array[i] = 0.0;
        }
        return vec;
    };

    MathWorkers.Vector.ones = function(length, datatype) {
        var vec = new MathWorkers.Vector(length, datatype);
        for (var i = 0; i < length; ++i) {
            vec.array[i] = 1.0;
        }
        return vec;
    };

    MathWorkers.Vector.random = function(length, datatype) {
        // TODO: fill with different random things depending on datatype
        var vec = new MathWorkers.Vector(length, datatype);
        for (var i = 0; i < length; ++i) {
            vec.array[i] = Math.random();
        }
        return vec;
    };

    MathWorkers.Vector.prototype.map = function(func) {
        for (var i = 0; i < this.length; i++) {
            this.array[i] = func(this.array[i]);
        }
        return this;
    }

}());


(function(){

    MathWorkers.comm = new function() {
        this.isNode = false;

        this.postMessageToWorker = function(worker, data, buffer) {
            if (this.isNode) {
                worker.send(data);
            } else {
                worker.postMessage(data, buffer);
            }
        };

        this.setOnMessage = function(worker, handler) {
            if (this.isNode) {
                worker.on("message", handler);
            } else {
                worker.onmessage = handler;
            }
        };

        this.disconnect = function(worker) {
            if (this.isNode) {
                worker.disconnect();
            } else {
                worker.terminate();
            }
        };
    };

}());


(function(){

    var that;
    var objectBuffer = {};
    var workersReported = {};
    var reductionBuffer = [];

    MathWorkers.Coordinator = function(nWorkersInput, workerFilePath, isNode) {
        this.nWorkers = nWorkersInput;
        this.workerPool = [];
        that = this;

        // Set isNode
        MathWorkers.comm.isNode = isNode || false;

        // Create the worker pool
        var worker;
        for (var i = 0; i < nWorkersInput; i++) {
            if (isNode) {
                worker = require("child_process").fork(workerFilePath);
            } else {
                worker = new Worker(workerFilePath);
            }
            MathWorkers.comm.setOnMessage(worker, onmessageHandler);
            MathWorkers.comm.postMessageToWorker(worker, {handle: "_init", id: i, isNode: isNode});
            this.workerPool.push(worker);
        }

        this.getObjectBuffer = function() {
            return objectBuffer;
        };

        this.disconnect = function() {
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.disconnect(worker);
            });
            this.nWorkers = 0;
            this.workerPool = [];
        };

        this.broadcastMessage = function(message) {
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.postMessageToWorker(worker, {handle: "_broadcastMessage",
                    message: message
                });
            });
        };

        this.broadcastData = function(data, tag, trigger) {
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.postMessageToWorker(worker, {handle: "_broadcastData",
                    data: data,
                    trigger: trigger,
                    tag: tag
                });
            });
        };

        /**
         * Scatter a Vector into separate pieces to all workers
         *
         * @param {!MathWorkers.Vector} vec Vector to be scattered
         * @param {!string} key to vector in object map
         * @param {!string} tag message tag
         */
        this.scatterVectorToWorkers = function(vec, key, tag) {
            // Set empty workers reported for tag
            workersReported[tag] = emptyWorkersReportedList();

            // Split the vector into equal-ish (load balanced) chunks and send out
            this.workerPool.forEach(function(worker, i) {
                var lb = MathWorkers.util.loadBalance(vec.length, that.nWorkers, i);
                var subv = MathWorkers.util.copyTypedArray(vec.array.subarray(lb.ifrom, lb.ito), vec.datatype);
                var buf = subv.buffer;
                MathWorkers.comm.postMessageToWorker(worker, {
                    handle: "_scatterVector",
                    key: key,
                    tag: tag,
                    datatype: vec.datatype,
                    vec: buf
                }, [buf]);
            });
        };

        /**
         * Trigger workers to send their parts of the distributed vector to the coordinator
         *
         * @param key
         * @param tag
         */
        this.gatherVectorFromWorkers = function(key, tag) {
            // Set empty workers reported for tag
            workersReported[tag] = emptyWorkersReportedList();
            reductionBuffer = [];

            // Trigger each worker to send its vector
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.postMessageToWorker(worker, {
                    handle: "_gatherVector",
                    key: key,
                    tag: tag
                });
            });
        };


    };

    // Set event emitter inheritance
    MathWorkers.Coordinator.prototype = new MathWorkers.EventEmitter();

    var emptyWorkersReportedList = function() {
        var workersReportedList = [];
        for (var i = 0; i < that.nWorkers; i++) {
            workersReportedList[i] = 0;
        }
        return workersReportedList;
    };

    var allWorkersReported = function(workersReportedList) {
        for (var i = 0; i < that.nWorkers; i++) {
            if (workersReportedList[i] == 0) {
                return false;
            }
        }
        return true;
    };

    var numWorkersReported = function(workersReportedList) {
        var total = 0;
        for (var i = 0; i < that.nWorkers; i++) {
            total += workersReportedList[i];
        }
        return total;
    };

    var onmessageHandler = function(event) {
        var data = event.data || event;
        switch (data.handle) {
            case "_sendCoordinatorData":
                return handleSendCoordinatorData(data);
            case "_handshake":
                return handleHandshake(data);
            case "_sendVectorToCoordinator":
                return handleGatherVector(data);
            default:
                console.error("Invalid worker communication handle: " + data);
        }
    };

    var handleSendCoordinatorData = function(data) {
        objectBuffer = data;
        console.log("Coordinator got data: " + data.id);
    };

    var handleHandshake = function(data) {
        workersReported[data.tag][data.id] = 1;
        if (allWorkersReported(workersReported[data.tag])) {
            that.emit(data.tag);
        }
    };

    var handleGatherVector = function(data) {
        reductionBuffer[data.id] = MathWorkers.util.copyTypedArray(data.vectorBuffer, data.datatype);
        workersReported[data.tag][data.id] = 1;
        if (allWorkersReported(workersReported[data.tag])) {
            // Collect all arrays in buffer into one, stored in
            var totalLength = 0;
            var offsets = [0];
            for (var w = 0; w < that.nWorkers; w++) {
                offsets.push(reductionBuffer[w].length);
                totalLength += reductionBuffer[w].length;
            }
            objectBuffer = new MathWorkers.Vector(totalLength, data.datatype);
            for (w = 0; w < that.nWorkers; w++) {
                var workerArray = reductionBuffer[w];
                var offset = offsets[w];
                for (var i = 0; i < workerArray.length; i++) {
                    objectBuffer.array[offset + i] = workerArray[i];
                }
            }
            that.emit(data.tag);
        }
    };

}());


/**
 * Interface to Vector that is distributed across workers
 */
(function() {

    /**
     * Given a Vector, distribute over workers
     *
     * @param coordinator
     * @param vector
     * @param key
     * @param emitEventName
     * @constructor
     */
    MathWorkers.DistributedVector = function(coordinator, vector, key, emitEventName) {
        this.datatype = vector.datatype || MathWorkers.Datatype.Float32;
        this.length = vector.length || 0;
        this.key = key;

        var that = this;
        var tag = "distributeVector:" + key;
        var gatheredVector = null;

        /**
         * Upon successful distribution, emit event for next event
         */
        coordinator.on(tag, function() {
            that.emit(emitEventName);
        });

        // Scatter vector data across workers
        coordinator.scatterVectorToWorkers(vector, that.key, tag);

        this.getGatheredVector = function() {
            return gatheredVector;
        };

        /**
         * Gather distributed vector data into the master thread in a new Vector object
         */
        this.gather = function(emitEventName) {
            var responseTag = "gatherVector:" + that.key;
            coordinator.gatherVectorFromWorkers(that.key, responseTag);
            coordinator.on(responseTag, function() {
                // Put gathered vector into object's storage
                gatheredVector = coordinator.getObjectBuffer();
                that.emit(emitEventName);
            });
        };

        /**
         * Map the distributed vector
         *
         * @param func
         */
        this.map = function(func) {
            coordinator.broadcastData(func, tag, "DistributedVector:map");
        };

    };

    // Set event emitter inheritance
    MathWorkers.DistributedVector.prototype = new MathWorkers.EventEmitter();

}());


(function() {

    MathWorkers.Interface = function(nWorkersInput, workerFilePath, isNode) {

        var coordinator = new MathWorkers.Coordinator(nWorkersInput, workerFilePath, isNode);

        // Interface to coordinator event emmiter
        this.on = function(eventName, callBack) {
            coordinator.on(eventName, callBack);
        };

        // Send a message to the worker pool
        this.broadcastMessage = function(message, callback) {
            coordinator.broadcastMessage(message);
            if (typeof callback === "function") {
                callback();
            }
        };

        this.newDistributedVector = function(vector, key, eventName) {
            return new MathWorkers.DistributedVector(coordinator, vector, key, eventName);
        }
    };

}());


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Exporting for node.js
    module.exports = MathWorkers;
} else if (typeof window !== 'undefined') {
    // Exporting for browser
    window.MathWorkers = MathWorkers;
} else {
    // Exporting for web worker
    self.MathWorkers = MathWorkers;
}

})();
