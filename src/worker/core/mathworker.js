(function(){

    var that;

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
        console.log(that.id);
        MathWorkers.comm.postMessageToCoordinator({handle: "_sendCoordinatorData",
            id: that.id, isNode: that.isNode});
    };

    var handleSendWorkerData = function(data) {
        objectBuffer = data;
        console.log(data);
    };

    var handleBroadcastMessage = function(data) {
        console.log(that.id + ": " + data.message);
    };

    var handleScatterVector = function(data) {
        var buf = data.vec;
        //objectBuffer = MathWorkers.util.(new Float64Array(buf));

            //handleTrigger(data, objectBuffer);
    };

}());
