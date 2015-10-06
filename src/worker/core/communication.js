(function(){

    MathWorker.Communication = function() {

        this.postMessageToCoordinator = function(data, buffer) {
            self.postMessage(data, buffer);
        };

        this.setOnMessage = function(handler) {
            self.onmessage = handler;
        }
    };

    MathWorker.comm = new MathWorker.Communication();

}());
