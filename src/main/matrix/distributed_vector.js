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
        var eventChain = [];

        if (emitEventName != null) {
            /**
             * Upon successful distribution, emit event for next event
             */
            coordinator.on(tag, function () {
                that.emit(emitEventName);
            });

            // Scatter vector data across workers
            coordinator.scatterVectorToWorkers(vector, that.key, tag);
        } else {
            // Chain?
            emitEventName = key + ":0";
            eventChain.push(emitEventName);
            coordinator.scatterVectorToWorkers(vector, that.key, tag);
            coordinator.on(tag, function () {
                that.emit(emitEventName);
            });
        }

        this.end = function(emitEventName) {
            // Chain end?
            that.on(key + ":" + (eventChain.length - 1), function() {
                that.emit(emitEventName);
            });
            return this;
        };

        /**
         * Access to the vector buffer
         */
        this.getGatheredVector = function() {
            return gatheredVector;
        };

        /**
         * Gather distributed vector data into the master thread in a new Vector object
         */
        this.gather = function(emitEventName) {
            var callback = function() {
                var responseTag = "gatherVector:" + that.key;
                coordinator.gatherVectorFromWorkers(that.key, responseTag);
                coordinator.on(responseTag, function() {
                    // Put gathered vector into object's storage
                    gatheredVector = coordinator.getObjectBuffer();
                    that.emit(emitEventName);
                });
            };

            // chain
            if (emitEventName == null) {
                emitEventName = key + ":" + eventChain.length;
                that.on(key + ":" + (eventChain.length - 1), callback);
                eventChain.push(emitEventName);
            } else {
                callback();
            }
            return this;
        };

        /**
         * Multiply each element in the distributed vector by a scalar
         */
        this.scale = function(a, emitEventName) {
            var callback = function() {
                var responseTag = "vectorScale:" + that.key;
                coordinator.broadcastData({"key": that.key, "scalar": a}, responseTag, "_vectorScale");
                coordinator.on(responseTag, function() {
                    that.emit(emitEventName);
                });
            };

            // chain
            if (emitEventName == null) {
                emitEventName = key + ":" + eventChain.length;
                that.on(key + ":" + (eventChain.length - 1), callback);
                eventChain.push(emitEventName);
            } else {
                callback();
            }
            return this;
        };

    };

    // Set event emitter inheritance
    MathWorkers.DistributedVector.prototype = new MathWorkers.EventEmitter();

}());
