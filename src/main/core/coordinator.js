(function(){

    MathWorkers.Coordinator = function(nWorkersInput, workerFilePath, isNode) {
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
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.disconnect(worker);
            });
            this.nWorkers = 0;
            this.workerPool = [];
        };

        this.broadcastMessage = function(message) {
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.postMessageToWorker(worker, {handle: "_broadcastMessage", message: message});
            });
        };

        /**
         * Scatter a Vector into separate pieces to all workers
         *
         * @param {!MathWorkers.Vector} vec Vector to be scattered
         * @param {!string} tag message tag
         */
        this.scatterVectorToWorkers = function(vec, tag) {
            // Split the vector into equal-ish (load balanced) chunks and send out
            this.workerPool.forEach(function(worker, i) {
                var lb = MathWorkers.util.loadBalance(vec.length, i);
                var subv = MathWorkers.util.copyTypedArray(vec.array.subarray(lb.ifrom, lb.ito));
                var buf = subv.buffer;
                MathWorkers.comm.postMessageToWorker(worker, {
                    handle: "_scatterVector",
                    tag: tag,
                    datatype: vec.datatype,
                    vec: buf
                }, [buf]);
            });
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
