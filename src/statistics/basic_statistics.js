// Copyright 2014 Adrian W. Lange

/**
 * A few simple statistics functions
 */
MW.stats = {};

/**
 * Compute basic summary statistics for a generic Array or Vector
 *
 * Returns an object containing number of elements, mean, standard deviation,
 * minimum, maximum, and quartiles
 */
MW.stats.summary = function(data) {
    MW.util.checkNullOrUndefined(data);
    var arr;
    if (data instanceof MW.Vector) {
        arr = data.array;
    } else if (data instanceof Array || data instanceof Float64Array) {
        arr = data;
    } else {
        throw new TypeError("Invalid data type for summary(). Must be Array, Float64Array, or Vector.");
    }

    var i;
    var tot = 0.0;
    var amax = Math.max.apply(Math, arr);
    var amin = Math.min.apply(Math, arr);
    for (i = 0; i < arr.length; ++i) {
        tot += arr[i];
    }
    var mean = tot / arr.length;
    tot = 0.0;
    for (i = 0; i < arr.length; ++i) {
        var tmp = mean - arr[i];
        tot += tmp * tmp;
    }
    var stddev = Math.sqrt(tot / arr.length);

    // Sort for quartiles
    arr.sort(function(a, b){return a-b});
    var fourth = (nRuns / 4)|0;
    var q25 = arr[fourth - 1];
    var q50 = arr[2*fourth - 1];
    var q75 = arr[3*fourth - 1];

    return {
        n: arr.length,
        mean: mean,
        stddev: stddev,
        minimum: amin,
        maximum: amax,
        quartile25: q25,
        quartile50: q50,
        quartile75: q75
    };
};

