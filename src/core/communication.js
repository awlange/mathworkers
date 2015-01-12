// Copyright 2014 Adrian W. Lange

/**
 *  A place for internal communication cross-compatibility between
 *  HTML5 web workers and node.js cluster workers
 */
var comm = {};

comm.postMessage = function(message, buffer) {
    if (global.logLevel > 2) {
        console.log("Posting message: %j", message);
    }

    if (global.isNode) {
        process.send({data: message});
    } else {
        self.postMessage(message, buffer);
    }
};

comm.postMessageToWorker = function(workerIndex, message, buffer) {
    var worker = global.getWorker(workerIndex);
    if (global.isNode) {
        worker.send({data: message});
    } else {
        worker.postMessage(message, buffer);
    }
};

comm.setOnMessage = function(onmessageHandler) {
    if (global.isNode) {
        process.on("message", onmessageHandler);
    } else {
        self.onmessage = onmessageHandler;
    }
};
