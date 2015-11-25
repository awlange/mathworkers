(function(){

    MathWorkers.comm = new function() {
        this.isNode = false;

        this.postMessageToWorker = function(worker, data, buffer) {
            if (this.isNode) {
                worker.send(data);
            } else {
                worker.postMessage(data, buffer);
            }
        };

        this.setOnMessage = function(worker, handler) {
            if (this.isNode) {
                worker.on("message", handler);
            } else {
                worker.onmessage = handler;
            }
        };

        this.disconnect = function(worker) {
            if (this.isNode) {
                worker.disconnect();
            } else {
                worker.terminate();
            }
        };
    };

}());
