(function(){

    var Communication = function() {};

    Communication.postMessageToCoordinator = function(data, buffer) {
        self.postMessage(data, buffer);
    };

    Communication.setOnMessage = function(handler) {
        self.onmessage = handler;
    };

    MathWorker.comm = new Communication();

}());
