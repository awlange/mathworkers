(function(){

    var that;

    MathWorkers.Coordinator = function(nWorkersInput, workerFilePath, isNode) {
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

        this.disconnect = function() {
            for (var i = 0; i < that.nWorkers; i++) {
                MathWorkers.comm.disconnect(that.workerPool[i]);
            }
            that.nWorkers = 0;
            that.workerPool = [];
        };

        this.broadcastMessage = function(message) {
            for (var i = 0; i < that.workerPool.length; i++) {
                MathWorkers.comm.postMessageToWorker(that.workerPool[i], {handle: "_broadcastMessage", message: message});
            }
        };
    };

    // Set event emitter inheritance
    MathWorkers.Coordinator.prototype = new MathWorkers.EventEmitter();

    var objectBuffer = {};

    var onmessageHandler = function(event) {
        var data = event.data || event;
        switch (data.handle) {
            case "_sendCoordinatorData":
                return handleSendCoordinatorData(data);
            default:
                console.error("Invalid worker communication handle: " + data);
        }
    };

    var handleSendCoordinatorData = function(data) {
        objectBuffer = data;
        console.log("Coordinator got data: " + data.id);
    };

}());
