// Copyright 2014 Adrian W. Lange

/**
 *  General internal utility functions
 */
MW.util = {};

MW.util.loadBalance = function(n) {
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
 *  Verify that x is neither null nor undefined.
 */
MW.util.checkNullOrUndefined = function(x) {
    if (x === undefined || x === null) {
        throw new TypeError("Undefined or null variable.");
    }
};

/**
 *  Verify that x is a Number and not null or undefined
 */
MW.util.checkNumber = function(x) {
    MW.util.checkNullOrUndefined(x);
    if (typeof x != 'number') {
        throw new TypeError("Expected type Number but is type " + typeof x);
    }
};

/**
 *  Verify that x is a Function and not null or undefined
 */
MW.util.checkFunction = function(x) {
    MW.util.checkNullOrUndefined(x);
    if (typeof x != 'function') {
        throw new TypeError("Expected type Function but is type " + typeof x);
    }
};

/**
 *  Verify that x is an Array or Float64Array and not null or undefined
 */
MW.util.checkArray = function(x) {
    MW.util.checkNullOrUndefined(x);
    if (!(x instanceof Array || x instanceof Float64Array)) {
        throw new TypeError("Expected type Array but is type " + typeof x);
    }
};

/**
 *  Verify that x is a Float64Array and not null or undefined
 */
MW.util.checkFloat64Array = function(x) {
    MW.util.checkNullOrUndefined(x);
    if (!(x instanceof Float64Array)) {
        throw new TypeError("Expected type Float64Array but is type " + typeof x);
    }
};

