(function(){

    var that;

    var Communication = function(isNode) {
        that = this;

        this.isNode = isNode || false;
    };

    Communication.prototype.postMessageToWorker = function(worker, data, buffer) {
        if (that.isNode) {
            worker.send(data);
        } else {
            worker.postMessage(data, buffer);
        }
    };

    Communication.prototype.setOnMessage = function(worker, handler) {
        if (that.isNode) {
            worker.on("message", handler);
        } else {
            worker.onmessage = handler;
        }
    };

    Communication.prototype.disconnect = function(worker) {
        if (that.isNode) {
            worker.disconnect();
        } else {
            worker.terminate();
        }
    };

    MathWorkers.Communication = Communication;

}());

MathWorkers.comm = new MathWorkers.Communication();

