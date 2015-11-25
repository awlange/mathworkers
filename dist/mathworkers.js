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

    MathWorkers.Coordinator = function(nWorkersInput, workerFilePath, isNode) {
        this.nWorkers = nWorkersInput;
        this.workerPool = [];

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

        this.disconnect = function() {
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.disconnect(worker);
            });
            this.nWorkers = 0;
            this.workerPool = [];
        };

        this.broadcastMessage = function(message) {
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.postMessageToWorker(worker, {handle: "_broadcastMessage", message: message});
            });
        };

        /**
         * Scatter a Vector into separate pieces to all workers
         *
         * @param {!MathWorkers.Vector} vec Vector to be scattered
         * @param {!string} tag message tag
         */
        this.scatterVectorToWorkers = function(vec, tag) {
            // Split the vector into equal-ish (load balanced) chunks and send out
            this.workerPool.forEach(function(worker, i) {
                var lb = MathWorkers.util.loadBalance(vec.length, i);
                var subv = MathWorkers.util.copyTypedArray(vec.array.subarray(lb.ifrom, lb.ito));
                var buf = subv.buffer;
                MathWorkers.comm.postMessageToWorker(worker, {
                    handle: "_scatterVector",
                    tag: tag,
                    datatype: vec.datatype,
                    vec: buf
                }, [buf]);
            });
        };
    };

    // Set event emitter inheritance
    MathWorkers.Coordinator.prototype = new MathWorkers.EventEmitter();

    var objectBuffer = {};

    var onmessageHandler = function(event) {
        var data = event.data || event;
        switch (data.handle) {
            case "_sendCoordinatorData":
                return handleSendCoordinatorData(data);
            default:
                console.error("Invalid worker communication handle: " + data);
        }
    };

    var handleSendCoordinatorData = function(data) {
        objectBuffer = data;
        console.log("Coordinator got data: " + data.id);
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


(function() {

    MathWorkers.Interface = function(nWorkersInput, workerFilePath, isNode) {

        var coordinator = new MathWorkers.Coordinator(nWorkersInput, workerFilePath, isNode);

        // Send a message to the worker pool
        this.broadcastMessage = function(message, callback) {
            coordinator.broadcastMessage(message);

            if (typeof callback === "function") {
                callback();
            }
        };

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
