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
        var currentEventChain = ["0:0"];
        var eventChains = [];

        /**
         * General pattern for setting event chain methods
         */
        var eventChainMethod = function(emitEventName, callback) {
            if (emitEventName == null) {
                emitEventName = eventChains.length + ":" + currentEventChain.length;
                that.on(currentEventChain[currentEventChain.length - 1], callback, [emitEventName]);
                currentEventChain.push(emitEventName);
            } else {
                callback(emitEventName);
            }
        };

        /**
         * Vector scattering function
         */
        var scatterVector = function(vec, emitEventName) {
            eventChainMethod(emitEventName, function(emitEventName) {
                coordinator.on(tag, function () {
                    that.emit(emitEventName);
                });
                coordinator.scatterVectorToWorkers(vec, that.key, tag);
            });
        };

        /**
         * Constructor scatter call. It is an event chain method too!
         */
        scatterVector(vector, emitEventName);

        /**
         * End of the chain. Trigger the chain to execute by emitting the first event name.
         */
        this.end = function(emitEventName) {
            // Chain end
            that.on(eventChains.length + ":" + (currentEventChain.length - 1), function() {
                that.emit(emitEventName);
            });

            // Trigger the first event in the chain
            that.emit(currentEventChain[0]);

            // Reset for next event chain
            eventChains.push(currentEventChain);
            currentEventChain = [eventChains.length + ":0"];

            return this;
        };

        /**
         * Access to the vector buffer
         */
        this.getGatheredVector = function() {
            return gatheredVector;
        };

        /**
         * Scatter gatheredVector back to the workers
         */
        this.scatterGatheredVector = function(emitEventName) {
            scatterVector(gatheredVector, emitEventName);
            return this;
        };

        /**
         * Gather distributed vector data into the master thread in a new Vector object
         */
        this.gather = function(emitEventName) {
            eventChainMethod(emitEventName, function(emitEventName) {
                var responseTag = "gatherVector:" + that.key;
                coordinator.gatherVectorFromWorkers(that.key, responseTag);
                coordinator.on(responseTag, function() {
                    // Put gathered vector into object's storage
                    gatheredVector = coordinator.getObjectBuffer();
                    that.emit(emitEventName);
                });
            });
            return this;
        };

        /**
         * Multiply each element in the distributed vector by a scalar
         */
        this.scale = function(a, emitEventName) {
            eventChainMethod(emitEventName, function(emitEventName) {
                var responseTag = "vectorScale:" + that.key;
                coordinator.broadcastData({"key": that.key, "scalar": a}, responseTag, "_vectorScale");
                coordinator.on(responseTag, function() {
                    that.emit(emitEventName);
                });
            });
            return this;
        };

    };

    // Set event emitter inheritance
    MathWorkers.DistributedVector.prototype = new MathWorkers.EventEmitter();

}());
