(function(){

    var that;
    var objectBuffer = {};
    var workersReported = {};

    MathWorkers.Coordinator = function(nWorkersInput, workerFilePath, isNode) {
        this.nWorkers = nWorkersInput;
        this.workerPool = [];
        that = this;

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
                MathWorkers.comm.postMessageToWorker(worker, {handle: "_broadcastMessage",
                    message: message
                });
            });
        };

        this.broadcastData = function(data, tag, trigger) {
            this.workerPool.forEach(function(worker) {
                MathWorkers.comm.postMessageToWorker(worker, {handle: "_broadcastData",
                    data: data,
                    trigger: trigger,
                    tag: tag
                });
            });
        };

        /**
         * Scatter a Vector into separate pieces to all workers
         *
         * @param {!MathWorkers.Vector} vec Vector to be scattered
         * @param {!string} key to vector in object map
         * @param {!string} tag message tag
         */
        this.scatterVectorToWorkers = function(vec, key, tag) {
            // Set empty workers reported for tag
            workersReported[tag] = emptyWorkersReportedList();

            // Split the vector into equal-ish (load balanced) chunks and send out
            this.workerPool.forEach(function(worker, i) {
                var lb = MathWorkers.util.loadBalance(vec.length, that.nWorkers, i);
                var subv = MathWorkers.util.copyTypedArray(vec.array.subarray(lb.ifrom, lb.ito), vec.datatype);
                var buf = subv.buffer;
                MathWorkers.comm.postMessageToWorker(worker, {
                    handle: "_scatterVector",
                    key: key,
                    tag: tag,
                    datatype: vec.datatype,
                    vec: buf
                }, [buf]);
            });
        };


    };

    // Set event emitter inheritance
    MathWorkers.Coordinator.prototype = new MathWorkers.EventEmitter();

    var emptyWorkersReportedList = function() {
        var workersReportedList = [];
        for (var i = 0; i < that.nWorkers; i++) {
            workersReportedList[i] = 0;
        }
        return workersReportedList;
    };

    var allWorkersReported = function(workersReportedList) {
        for (var i = 0; i < that.nWorkers; i++) {
            if (workersReportedList[i] == 0) {
                return false;
            }
        }
        return true;
    };

    var onmessageHandler = function(event) {
        var data = event.data || event;
        switch (data.handle) {
            case "_sendCoordinatorData":
                return handleSendCoordinatorData(data);
            case "_handshake":
                return handleHandshake(data);
            default:
                console.error("Invalid worker communication handle: " + data);
        }
    };

    var handleSendCoordinatorData = function(data) {
        objectBuffer = data;
        console.log("Coordinator got data: " + data.id);
    };

    var handleHandshake = function(data) {
        workersReported[data.tag][data.id] = 1;
        if (allWorkersReported(workersReported[data.tag])) {
            that.emit(data.tag);
        }
    }

}());
