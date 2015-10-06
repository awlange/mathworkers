(function(){

    var Communication = function() {};

    Communication.postMessageToWorker = function(worker, data, buffer) {
        worker.postMessage(data, buffer);
    };

    Communication.setOnMessage = function(worker, handler) {
        worker.onmessage = handler;
    };

    MathWorkers.comm = new Communication();

}());

