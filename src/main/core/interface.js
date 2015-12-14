(function() {

    MathWorkers.Interface = function(nWorkersInput, workerFilePath, isNode) {

        var coordinator = new MathWorkers.Coordinator(nWorkersInput, workerFilePath, isNode);

        // Interface to coordinator event emmiter
        this.on = function(eventName, callBack) {
            coordinator.on(eventName, callBack);
        };

        // Send a message to the worker pool
        this.broadcastMessage = function(message, callback) {
            coordinator.broadcastMessage(message);
            if (typeof callback === "function") {
                callback();
            }
        };

        this.newDistributedVector = function(vector, key, eventName) {
            return new MathWorkers.DistributedVector(coordinator, vector, key, eventName);
        }
    };

}());
