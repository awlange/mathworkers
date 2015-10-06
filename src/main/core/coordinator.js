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
            MathWorkers.comm.disconnect(that.workerPool[i]);
        }
        that.nWorkers = 0;
        that.workerPool = [];
    };

    MathWorkers.Coordinator = Coordinator;

}());
