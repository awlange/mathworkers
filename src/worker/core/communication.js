(function(){

    var that;

    var Communication = function(isNode) {
        that = this;

        this.isNode = isNode || false;
    };

    Communication.prototype.postMessageToCoordinator = function(data, buffer) {
        if (that.isNode) {
            console.log("mmhmm: " + data);
            process.send(data);
            console.log("schmeh");
        } else {
            self.postMessage(data, buffer);
        }
    };

    Communication.prototype.setOnMessage = function(handler) {
        if (that.isNode) {
            process.on("message", handler);
        } else {
            self.onmessage = handler;
        }
    };

    MathWorker.Communication = Communication;

}());

MathWorker.comm = new MathWorker.Communication();
