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
