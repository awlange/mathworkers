(function(){

    MathWorkers.comm = new function() {
        this.isNode = false;

        this.postMessageToWorker = function(worker, data, buffer) {
            if (MathWorkers.comm.isNode) {
                worker.send(data);
            } else {
                worker.postMessage(data, buffer);
            }
        };

        this.setOnMessage = function(worker, handler) {
            if (MathWorkers.comm.isNode) {
                worker.on("message", handler);
            } else {
                worker.onmessage = handler;
            }
        };

        this.disconnect = function(worker) {
            if (MathWorkers.comm.isNode) {
                worker.disconnect();
            } else {
                worker.terminate();
            }
        };
    };

}());
