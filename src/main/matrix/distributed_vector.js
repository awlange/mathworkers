/**
 * Interface to Vector that is distributed across workers
 */
(function() {

    /**
     * Given a Vector, distribute over workers
     *
     * @param coordinator
     * @param vector
     * @param key
     * @param emitEventName
     * @constructor
     */
    MathWorkers.DistributedVector = function(coordinator, vector, key, emitEventName) {
        this.datatype = vector.datatype || MathWorkers.Datatype.Float32;
        this.length = vector.length || 0;
        this.key = key;

        var that = this;
        var tag = "distributeVector:" + key;
        var gatheredVector = null;

        /**
         * Upon successful distribution, emit event for next event
         */
        coordinator.on(tag, function() {
            that.emit(emitEventName);
        });

        // Scatter vector data across workers
        coordinator.scatterVectorToWorkers(vector, that.key, tag);

        this.getGatheredVector = function() {
            return gatheredVector;
        };

        /**
         * Gather distributed vector data into the master thread in a new Vector object
         */
        this.gather = function(emitEventName) {
            var responseTag = "gatherVector:" + that.key;
            coordinator.gatherVectorFromWorkers(that.key, responseTag);
            coordinator.on(responseTag, function() {
                // Put gathered vector into object's storage
                gatheredVector = coordinator.getObjectBuffer();
                that.emit(emitEventName);
            });
        };

        /**
         * Map the distributed vector
         *
         * @param func
         */
        this.map = function(func) {
            coordinator.broadcastData(func, tag, "DistributedVector:map");
        };

    };

    // Set event emitter inheritance
    MathWorkers.DistributedVector.prototype = new MathWorkers.EventEmitter();

}());
