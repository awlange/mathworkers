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
     * @param eventName
     * @constructor
     */
    MathWorkers.DistributedVector = function(coordinator, vector, key, eventName) {
        this.datatype = vector.datatype || MathWorkers.Datatype.Float32;
        this.length = vector.length || 0;
        this.key = key;

        var that = this;
        var tag = "distributeVector:" + key;

        // Event for unlocking
        coordinator.on(tag, function() {
            console.log("It's ready!");
            ready = true;
            that.emit(eventName);
        });

        // Scatter vector data across workers
        coordinator.scatterVectorToWorkers(vector, key, tag);

        /**
         * Gather distributed vector data into the master thread in a new Vector object
         *
         * TODO
         */
        this.gather = function() {
            this.block();  // must be ready

        };

        /**
         * Map the distributed vector
         *
         * @param func
         */
        this.map = function(func) {
            ready = false;
            coordinator.broadcastData(func, tag, "DistributedVector:map");
        };

    };

    // Set event emitter inheritance
    MathWorkers.DistributedVector.prototype = new MathWorkers.EventEmitter();

}());
