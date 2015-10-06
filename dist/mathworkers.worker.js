(function() {
"use strict";

/**
 * The MathWorker namespace that everything hangs off of
 *
 * @namespace MathWorker
 */
var MathWorker = {};



(function(){

    MathWorker.Communication = function() {

        this.postMessageToCoordinator = function(data, buffer) {
            self.postMessage(data, buffer);
        };

        this.setOnMessage = function(handler) {
            self.onmessage = handler;
        }
    };

    MathWorker.comm = new MathWorker.Communication();

}());


(function(){

    var that;

    var Worker = function(id) {
        that = this;
        this.id = id || 0;

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
    };

    Worker.handleSendWorkerData = function(data) {
        objectBuffer = data;
        console.log(data);
    };

    MathWorker.Worker = Worker;

}());


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Exporting for node.js
    module.exports = MathWorker;
} else if (typeof window !== 'undefined') {
    // Exporting for browser
    window.MathWorker = MathWorker;
} else {
    // Exporting for web worker
    self.MathWorker = MathWorker;
}

})();


var worker = new MathWorker.Worker();
