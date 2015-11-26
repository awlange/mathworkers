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
     * @constructor
     */
    MathWorkers.DistributedVector = function(coordinator, vector, key) {
        this.datatype = vector.datatype || MathWorkers.Datatype.Float32;
        this.length = vector.length || 0;
        this.key = key;

        // Lock for compute readiness
        var ready = false;

        var tag = "distributeVector:" + key;

        // Event for unlocking
        coordinator.on(tag, function() {
            console.log("It's ready!");
            ready = true;
        });

        coordinator.scatterVectorToWorkers(vector, key, tag);
    };

}());
