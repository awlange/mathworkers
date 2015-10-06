(function() {
"use strict";

/**
 * The MathWorkers namespace that everything hangs off of
 *
 * @namespace MathWorkers
 */
var MathWorkers = {};


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
        console.log(event);
        var data = event.data || event;
        switch (data.handle) {
            case "_sendCoordinatorData":
                return Coordinator.handleSendCoordinatorData(data);
            default:
                console.error("Invalid worker communication handle: " + data);
        }
    };

    Coordinator.handleSendCoordinatorData = function(data) {
        objectBuffer = data;
        console.log("Coordinator got data: " + data.id);
    };

    Coordinator.prototype.disconnect = function() {
        for (var i = 0; i < that.nWorkers; i++) {
            this.workerPool[i].disconnect();
        }
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
