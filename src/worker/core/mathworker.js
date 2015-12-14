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

        /**
         * A map of name to distributed object to be used in calculations
         */
        this.distributedObjectMap = {};

        ///**
        // * Register an event with a callback to be executed when the coordinator triggers the event
        // *
        // * @param {!string} trigger the unique label for the event being registered
        // * @param {function} callback the callback function to be registered
        // */
        //this.on = function(trigger, callback) {
        //    triggers[trigger] = [callback];
        //};

        /**
         * Register triggers
         */
        triggers["DistributedVector:map"] = function(key) {

        };
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
            case "_broadcastData":
                return handleBroadcastData(data);
            case "_scatterVector":
                return handleScatterVector(data);
            case "_DistributedVector:map":
                return handleDistributedVectorMap(data);
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
        if (triggers[data.trigger]) {
            triggers[data.trigger] = triggers[data.trigger] || [];
            var args = data.data || obj || [];
            triggers[data.trigger].forEach( function(fn) {
                fn.call(this, args);
            });
        } else {
            console.warn("Unregistered trigger: " + data.trigger);
        }
    };

    // Acknowledge something has happened to the Coordinator
    var handshake = function(tag) {
        MathWorkers.comm.postMessageToCoordinator({handle: "_handshake", id: that.id, tag: tag});
    };

    var handleSendWorkerData = function(data) {
        objectBuffer = data;
        console.log(data);
    };

    var handleBroadcastMessage = function(data) {
        console.log(that.id + ": " + data.message);
    };

    var handleBroadcastData = function(data) {
        handleTrigger(data, data.key);
    };

    var handleDistributedVectorMap = function(data) {
        handleTrigger(data, data.key);
    };

    /**
     * Store the scattered array as a Vector value under the provided key
     *
     * @param data
     */
    var handleScatterVector = function(data) {
        that.distributedObjectMap[data.key] = MathWorkers.Vector.fromArray(data.vec, data.datatype);
        handshake(data.tag);
    };

}());
