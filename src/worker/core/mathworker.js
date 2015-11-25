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
