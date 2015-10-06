(function(){

    var Utility = function() {};

    /**
     * Load balancing function.
     * Divides n up evenly among the specified number of workers.
     * Any remainder is distributed such that no worker has more than 1 extra piece in its range.
     *
     * @ignore
     * @returns {object} container for range index from (inclusive) and index to (non-inclusive) for the given id
     */
    Utility.prototype.loadBalance = function(n, nWorkers, id) {
        id = id || 0;
        var div = (n / nWorkers)|0;
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

    MathWorker.Utility = Utility;

}());

MathWorker.util = new MathWorker.Utility();
