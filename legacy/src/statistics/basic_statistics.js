// Copyright 2014 Adrian W. Lange

/**
 * Statistics methods namespace.
 *
 * @namespace MathWorkers.Stats
 */
MathWorkers.Stats = {};

/**
 * A statistical summary of a sample of numbers
 *
 * @typedef {Object} StatisticsSummary
 * @property {number} n number of elements sampled in this summary
 * @property {number} mean mean of the sample
 * @property {number} variance variance of the sample
 * @property {number} stddev standard deviation of the sample
 * @property {number} minimum minimum value in the sample
 * @property {number} maximum maximum value in the sample
 * @property {?number} quartile25 25th percentile value
 * @property {?number} quartile50 50th percentile value (or, the median)
 * @property {?number} quartile75 75th percentile value
 */

/**
 * Compute basic summary statistics for a generic Array, Float64Array, Vector, or Matrix
 *
 * Returns an object containing number of elements, mean, standard deviation,
 * minimum, maximum, and quartiles. The quartiles computed here are the so-called
 * "Tukey's Hinges".
 *
 * Quartiles are not reported if the data passed in contains less than 3 elements
 *
 * @param data {Array.<number>|Float64Array|MathWorkers.Vector|MathWorkers.Matrix} sample of numbers to be summarized
 * @returns {StatisticsSummary}
 * @function summary
 * @memberof MathWorkers.Stats
 */
MathWorkers.Stats.summary = function (data) {

    function getMedian(nfrom, nto) {
        var m = nto - nfrom + 1;
        var half = (m / 2) | 0;
        var odd = (m % 2);
        var median = odd ? arr[nfrom + half] : 0.5 * (arr[nfrom + half - 1] + arr[nfrom + half]);
        return {median: median, half: half, odd: odd};
    }

    MathWorkers.util.checkNullOrUndefined(data);
    // Copy the data to a local array so that we can sort without affecting data
    var i;
    var arr = [];
    if (data instanceof MathWorkers.Vector) {
        for (i = 0; i < data.array.length; ++i) {
            arr.push(data.array[i]);
        }
    } else if (data instanceof MathWorkers.Matrix) {
        for (i = 0; i < data.nrows; ++i) {
            for (var j = 0; j < data.ncols; ++j) {
                arr.push(data.array[i][j]);
            }
        }
    } else if (data instanceof Array || data instanceof Float64Array) {
        for (i = 0; i < data.length; ++i) {
            arr.push(data[i]);
        }
    } else {
        throw new TypeError("Invalid data type for summary(). Must be Array, Float64Array, or Vector.");
    }

    var tmp;
    var n = arr.length;
    var tot = 0.0;
    var amax = Math.max.apply(Math, arr);
    var amin = Math.min.apply(Math, arr);
    for (i = 0; i < n; ++i) {
        tot += arr[i];
    }
    var mean = tot / n;
    var variance = 0.0;
    for (i = 0; i < n; ++i) {
        tmp = mean - arr[i];
        variance += tmp * tmp;
    }
    variance /= n;
    var stddev = Math.sqrt(variance);

    var q25, q50, q75;
    if (n >= 3) {
        // Sort for quartiles
        arr.sort(function (a, b) {
            return a - b;
        });

        var x, y;
        x = getMedian(0, n - 1);
        q50 = x.median;
        y = getMedian(x.half, n - 1);
        q75 = y.median;
        if (x.odd) {
            y = getMedian(0, x.half);
            q25 = y.median;
        } else {
            y = getMedian(0, x.half - 1);
            q25 = y.median;
        }
    }

    return {
        n: arr.length,
        mean: mean,
        variance: variance,
        stddev: stddev,
        minimum: amin,
        maximum: amax,
        quartile25: q25,
        quartile50: q50,
        quartile75: q75
    };
};

