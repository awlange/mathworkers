(function() {
"use strict";

/**
 * The MathWorker namespace that everything hangs off of
 *
 * @namespace MathWorker
 */
var MathWorker = {};



(function(){

    var that;

    var Communication = function(isNode) {
        that = this;

        this.isNode = isNode || false;
    };

    Communication.prototype.postMessageToCoordinator = function(data, buffer) {
        if (that.isNode) {
            console.log("mmhmm: " + data);
            process.send(data);
            console.log("schmeh");
        } else {
            self.postMessage(data, buffer);
        }
    };

    Communication.prototype.setOnMessage = function(handler) {
        if (that.isNode) {
            process.on("message", handler);
        } else {
            self.onmessage = handler;
        }
    };

    MathWorker.Communication = Communication;

}());

MathWorker.comm = new MathWorker.Communication();


(function(){

    var that;

    var Worker = function(id, isNode) {
        that = this;
        this.id = id || 0;

        // Set isNode
        MathWorker.comm.isNode = isNode || false;

        // Set message handler
        MathWorker.comm.setOnMessage(onmessageHandler);
    };

    var objectBuffer = {};

    var onmessageHandler = function(event) {
        var data = event.data || event;
        switch (data.handle) {
            case "_init":
                return Worker.handleInit(data);
            case "_sendWorkerData":
                return Worker.handleSendWorkerData(data);
            default:
                console.error("Invalid worker communication handle: " + data);
        }
    };

    Worker.handleInit = function(data) {
        that.id = data.id;
        console.log(that.id);
        MathWorker.comm.postMessageToCoordinator({handle: "_sendCoordinatorData", id: that.id, isNode: that.isNode});
    };

    Worker.handleSendWorkerData = function(data) {
        objectBuffer = data;
        console.log(data);
    };

    MathWorker.Worker = Worker;

}());


    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    console.log(isNode);
    return new MathWorker.Worker(0, isNode);

})();
