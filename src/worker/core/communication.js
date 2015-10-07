(function(){


    MathWorker.comm = {
        isNode: false
    };

    MathWorker.comm.postMessageToCoordinator = function(data, buffer) {
        if (MathWorker.comm.isNode) {
            console.log("mmhmm: " + data);
            process.send(data);
            console.log("schmeh");
        } else {
            self.postMessage(data, buffer);
        }
    };

    MathWorker.comm.setOnMessage = function(handler) {
        if (MathWorker.comm.isNode) {
            process.on("message", handler);
        } else {
            self.onmessage = handler;
        }
    };

}());
