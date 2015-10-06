(function(){

    MathWorkers.Communication = function() {

        this.postMessageToWorker = function(worker, data, buffer) {
            worker.postMessage(data, buffer);
        };

        this.setOnMessage = function(worker, handler) {
            worker.onmessage = handler;
        }
    };

    MathWorkers.comm = new MathWorkers.Communication();

}());

