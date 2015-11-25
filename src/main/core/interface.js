(function() {

    MathWorkers.Interface = function(nWorkersInput, workerFilePath, isNode) {

        var coordinator = new MathWorkers.Coordinator(nWorkersInput, workerFilePath, isNode);

        // Send a message to the worker pool
        this.broadcastMessage = function(message, callback) {
            coordinator.broadcastMessage(message);
            if (typeof callback === "function") {
                callback();
            }
        };

        this.newDistributedVector = function(vector) {
            return new MathWorkers.DistributedVector(coordinator, vector);
        }
    };

}());
