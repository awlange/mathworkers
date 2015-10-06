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

    MathWorkers.Communication = Communication;

}());

MathWorkers.comm = new MathWorkers.Communication();

