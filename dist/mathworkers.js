(function() {
"use strict";

/**
 * The MathWorkers namespace that everything hangs off of
 *
 * @namespace MathWorkers
 */
var MathWorkers = {};


(function(){

    // Enum-like object of the allowed data types for MathWorkers
    MathWorkers.Datatype = Object.freeze({
        "Float32": {},
        "Float64": {}
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
        this.on = function (name, callback) {
            MathWorkers.util.checkFunction(callback);
            events[name] = [callback];
        };

        /**
         * Emits an event and executes the corresponding callback
         *
         * @param {!string} name the event name
         * @param {Array.<Object>} [args] an array of arguments to be passed to the callback
         */
        this.emit = function (name, args) {
            events[name] = events[name] || [];
            args = args || [];
            events[name].forEach(function (fn) {
                fn.call(this, args);
            });
        };
    }
}());



(function(){

    MathWorkers.util = function() {};

    /**
     * Verify that the environment executing this code has Web Worker support
     *
     * @ignore
     * @throws {Error}
     */
    MathWorkers.util.checkWebWorkerSupport = function() {
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
    MathWorkers.util.loadBalance = function(n, nWorkers, id) {
        id = id || 0;
        var div = (n / nWorkers)|0;
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
    MathWorkers.util.newTypedArray = function(length, datatype) {
        switch (datatype) {
            case MathWorkers.Datatype.Float32:
                return new Float32Array(length);
            case MathWorkers.Datatype.Float64:
                return new Float64Array(length);
            default:
                return null;
        }
    };

}());


(function(){

    MathWorkers.comm = {
        isNode: false
    };

    MathWorkers.comm.postMessageToWorker = function(worker, data, buffer) {
        if (MathWorkers.comm.isNode) {
            worker.send(data);
        } else {
            worker.postMessage(data, buffer);
        }
    };

    MathWorkers.comm.setOnMessage = function(worker, handler) {
        if (MathWorkers.comm.isNode) {
            worker.on("message", handler);
        } else {
            worker.onmessage = handler;
        }
    };

    MathWorkers.comm.disconnect = function(worker) {
        if (MathWorkers.comm.isNode) {
            worker.disconnect();
        } else {
            worker.terminate();
        }
    };

}());


(function(){

    var that;

    MathWorkers.Coordinator = function(nWorkersInput, workerFilePath, isNode) {
        that = this;

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
            for (var i = 0; i < that.nWorkers; i++) {
                MathWorkers.comm.disconnect(that.workerPool[i]);
            }
            that.nWorkers = 0;
            that.workerPool = [];
        };

        this.broadcastMessage = function(message) {
            for (var i = 0; i < that.workerPool.length; i++) {
                MathWorkers.comm.postMessageToWorker(that.workerPool[i], {handle: "_broadcastMessage", message: message});
            }
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


(function(){

    var Vector = function(length, datatype) {
        this.datatype = datatype || MathWorkers.Datatype.Float32;
        this.length = length || 0;
        this.array = null;
        if (this.length > 0) {
            this.array = MathWorkers.util.newTypedArray(this.length, this.datatype);
        }
    };

    Vector.prototype.random = function(length, datatype) {
        var vec = new Vector(length, datatype);
        for (var i = 0; i < size; ++i) {
            vec.array[i] = Math.random();
        }
        return vec;
    };

    MathWorkers.Vector = Vector;

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
