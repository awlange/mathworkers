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


(function(){

    var Utility = function() {};

    /**
     * Verify that the environment executing this code has Web Worker support
     *
     * @ignore
     * @throws {Error}
     */
    Utility.prototype.checkWebWorkerSupport = function() {
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
    Utility.prototype.loadBalance = function(n, nWorkers, id) {
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
    Utility.prototype.newTypedArray = function(length, datatype) {
        switch (datatype) {
            case MathWorkers.Datatype.Float32:
                return new Float32Array(length);
            case MathWorkers.Datatype.Float64:
                return new Float64Array(length);
            default:
                return null;
        }
    };

    MathWorkers.Utility = Utility;

}());

MathWorkers.util = new MathWorkers.Utility();


(function(){

    var that;

    var Communication = function(isNode) {
        that = this;

        this.isNode = isNode || false;
    };

    Communication.prototype.postMessageToWorker = function(worker, data, buffer) {
        if (that.isNode) {
            worker.send(data);
        } else {
            worker.postMessage(data, buffer);
        }
    };

    Communication.prototype.setOnMessage = function(worker, handler) {
        if (that.isNode) {
            worker.on("message", handler);
        } else {
            worker.onmessage = handler;
        }
    };

    Communication.prototype.disconnect = function(worker) {
        if (that.isNode) {
            worker.disconnect();
        } else {
            worker.terminate();
        }
    };

    MathWorkers.Communication = Communication;

}());

MathWorkers.comm = new MathWorkers.Communication();



(function(){

    var that;

    var Coordinator = function(nWorkersInput, workerFilePath, isNode) {
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
    };

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

    Coordinator.prototype.disconnect = function() {
        for (var i = 0; i < that.nWorkers; i++) {
            MathWorkers.comm.disconnect(that.workerPool[i]);
        }
        that.nWorkers = 0;
        that.workerPool = [];
    };

    MathWorkers.Coordinator = Coordinator;

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
