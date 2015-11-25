/**
 * Interface to Vector that is distributed across workers
 */
(function() {

    /**
     * Given a Vector, distribute over workers
     *
     * @param coordinator
     * @param vector
     * @constructor
     */
    MathWorkers.DistributedVector = function(coordinator, vector) {
        this.datatype = vector.datatype || MathWorkers.Datatype.Float32;
        this.length = vector.length || 0;

        coordinator.scatterVectorToWorkers(vector, "_scatterVector");
    };


}());
