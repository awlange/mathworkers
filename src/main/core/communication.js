(function(){

    MathWorkers.comm = {
        isNode: false
    };

    MathWorkers.comm.postMessageToWorker = function(worker, data, buffer) {
        if (MathWorkers.comm.isNode) {
            worker.send(data);
        } else {
            worker.postMessage(data, buffer);
        }
    };

    MathWorkers.comm.setOnMessage = function(worker, handler) {
        if (MathWorkers.comm.isNode) {
            worker.on("message", handler);
        } else {
            worker.onmessage = handler;
        }
    };

    MathWorkers.comm.disconnect = function(worker) {
        if (MathWorkers.comm.isNode) {
            worker.disconnect();
        } else {
            worker.terminate();
        }
    };

}());
