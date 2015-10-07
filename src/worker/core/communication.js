(function(){

    MathWorker.comm = new function() {
        this.isNode = false;

        this.postMessageToCoordinator = function (data, buffer) {
            if (MathWorker.comm.isNode) {
                process.send(data);
            } else {
                self.postMessage(data, buffer);
            }
        };

        this.setOnMessage = function (handler) {
            if (MathWorker.comm.isNode) {
                process.on("message", handler);
            } else {
                self.onmessage = handler;
            }
        };
    };

}());
