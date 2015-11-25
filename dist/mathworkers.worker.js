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


(function() {

    MathWorkers.comm = new function() {
        this.isNode = false;

        this.postMessageToCoordinator = function (data, buffer) {
            if (this.isNode) {
                process.send(data);
            } else {
                self.postMessage(data, buffer);
            }
        };

        this.setOnMessage = function (handler) {
            if (this.isNode) {
                process.on("message", handler);
            } else {
                self.onmessage = handler;
            }
        };
    };

}());


(function(){

    var that;

    /**
     * An object mapping an event tag key to a registered callback value
     *
     * @member {Object}
     * @private
     */
    var triggers = {};

    MathWorkers.Worker = function(id, isNode) {
        that = this;
        this.id = id || 0;

        // Set isNode
        MathWorkers.comm.isNode = isNode || false;

        // Set message handler
        MathWorkers.comm.setOnMessage(onmessageHandler);
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
            case "_scatterVector":
                return handleScatterVector(data);
            default:
                console.error("Invalid worker communication handle: " + data);
        }
    };

    var handleInit = function(data) {
        that.id = data.id;
        MathWorkers.comm.postMessageToCoordinator({handle: "_sendCoordinatorData",
            id: that.id, isNode: that.isNode});
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
            console.warn("Unregistered trigger tag: " + data.tag);
        }
    };

    var handleSendWorkerData = function(data) {
        objectBuffer = data;
        console.log(data);
    };

    var handleBroadcastMessage = function(data) {
        console.log(that.id + ": " + data.message);
    };

    var handleScatterVector = function(data) {
        objectBuffer = MathWorkers.util.copyTypedArray(data.vec, data.datatype);
        handleTrigger(data, objectBuffer);
    };

}());


    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    return new MathWorkers.Worker(0, isNode);

})();
