(function() {

    MathWorkers.comm = new function() {
        this.isNode = false;

        this.postMessageToCoordinator = function (data, buffer) {
            if (this.isNode) {
                process.send(data);
            } else {
                self.postMessage(data, buffer);
            }
        };

        this.setOnMessage = function (handler) {
            if (this.isNode) {
                process.on("message", handler);
            } else {
                self.onmessage = handler;
            }
        };
    };

}());
