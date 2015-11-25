(function() {

    MathWorkers.util = new function() {

        /**
         * Verify that the environment executing this code has Web Worker support
         *
         * @ignore
         * @throws {Error}
         */
        this.checkWebWorkerSupport = function () {
            if (typeof(Worker) === "undefined") {
                throw new Error("Web Worker support not available for MathWorkers.");
            }
        };

        /**
         * Load balancing function.
         * Divides n up evenly among the specified number of workers.
         * Any remainder is distributed such that no worker has more than 1 extra piece in its range.
         *
         * @ignore
         * @returns {object} container for range index from (inclusive) and index to (non-inclusive) for the given id
         */
        this.loadBalance = function(n, nWorkers, id) {
            id = id || 0;
            var div = (n / nWorkers) | 0;
            var rem = n % nWorkers;

            var ifrom;
            var ito;
            if (id < rem) {
                ifrom = id * (div + 1);
                ito = ifrom + div + 1;
            } else {
                ifrom = id * div + rem;
                ito = ifrom + div;
            }

            return {ifrom: ifrom, ito: ito};
        };

        /**
         * Create a new typed array of given size and data type
         */
        this.newTypedArray = function(length, datatype) {
            switch (datatype) {
                case MathWorkers.Datatype.Float32:
                    return new Float32Array(length);
                case MathWorkers.Datatype.Float64:
                    return new Float64Array(length);
                default:
                    return null;
            }
        };

        /**
         * Create a copy of a provided typed array
         */
        this.copyTypedArray = function(arr, datatype) {
            switch (datatype) {
                case MathWorkers.Datatype.Float32:
                    return new Float32Array(arr);
                case MathWorkers.Datatype.Float64:
                    return new Float64Array(arr);
                default:
                    return null;
            }
        };
    };

}());
