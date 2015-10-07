(function() {
"use strict";

/**
 * The MathWorker namespace that everything hangs off of
 *
 * @namespace MathWorker
 */
var MathWorker = {};



(function(){


    MathWorker.comm = {
        isNode: false
    };

    MathWorker.comm.postMessageToCoordinator = function(data, buffer) {
        if (MathWorker.comm.isNode) {
            console.log("mmhmm: " + data);
            process.send(data);
            console.log("schmeh");
        } else {
            self.postMessage(data, buffer);
        }
    };

    MathWorker.comm.setOnMessage = function(handler) {
        if (MathWorker.comm.isNode) {
            process.on("message", handler);
        } else {
            self.onmessage = handler;
        }
    };

}());


(function(){

    var that;

    MathWorker.Worker = function(id, isNode) {
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
                return handleInit(data);
            case "_sendWorkerData":
                return handleSendWorkerData(data);
            case "_broadcastMessage":
                return handleBroadcastMessage(data);
            default:
                console.error("Invalid worker communication handle: " + data);
        }
    };

    var handleInit = function(data) {
        that.id = data.id;
        console.log(that.id);
        MathWorker.comm.postMessageToCoordinator({handle: "_sendCoordinatorData",
            id: that.id, isNode: that.isNode});
    };

    var handleSendWorkerData = function(data) {
        objectBuffer = data;
        console.log(data);
    };

    var handleBroadcastMessage = function(data) {
        console.log(that.id + ": " + data.message);
    };

}());


    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    console.log(isNode);
    return new MathWorker.Worker(0, isNode);

})();
