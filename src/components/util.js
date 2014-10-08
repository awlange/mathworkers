// Copyright 2014 Adrian W. Lange

/**
 *  General internal utility functions
 */
var util = {};
util.loadBalance = function(n) {
    var id = pool.myWorkerId;
	var div = Math.floor(n / pool.nWorkers);
	var rem = n % pool.nWorkers;

	// distribute remainder as evenly as possible
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
 *  Verify that x is neither null or undefined.
 *  Throws Error if not.
 */
util.checkNotNullOrUndefined = function(x) {
    if (x === undefined || x === null) {
        throw new TypeError("Undefined or null variable.");
    }
};

/**
 *  Verify that x is a Number and not null or undefined
 */
util.checkNumber = function(x) {
    util.checkNotNullOrUndefined(x);
    if (typeof x != 'number') {
        throw new TypeError("Expected type Number but is type " + typeof x);
    }
};

/**
 *  Verify that x is a Function and not null or undefined
 */
util.checkFunction = function(x) {
    util.checkNotNullOrUndefined(x);
    if (typeof x != 'function') {
        throw new TypeError("Expected type Function but is type " + typeof x);
    }
};

/**
 *  Verify that x is an Array or Float64Array and not null or undefined
 */
util.checkArray = function(x) {
    util.checkNotNullOrUndefined(x);
    if (!(x instanceof Array || x instanceof Float64Array)) {
        throw new TypeError("Expected type Array but is type " + typeof x);
    }
};

/**
 *  Verify that x is a Float64Array and not null or undefined
 */
util.checkFloat64Array = function(x) {
    util.checkNotNullOrUndefined(x);
    if (!(x instanceof Float64Array)) {
        throw new TypeError("Expected type Float64Array but is type " + typeof x);
    }
};

