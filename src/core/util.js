// Copyright 2014 Adrian W. Lange

/**
 * General utility functions intended for internal use
 *
 * @ignore
 */
MathWorkers.util = {};

/**
 * Verify that the environment executing this code has Web Worker support
 *
 * @ignore
 * @throws {Error}
 */
MathWorkers.util.checkWebWorkerSupport = function() {
    if (typeof(Worker) === "undefined") {
        throw new Error("Web Worker support not available for MathWorkers.");
    }
};

/**
 * Load balancing function.
 * Divides n up evenly among the number of workers in the pool.
 * Any remainder is distributed such that no worker has more than 1 extra piece in its range.
 *
 * @ignore
 * @returns {object} container for range index from (inclusive) and index to (non-inclusive)
 */
MathWorkers.util.loadBalance = function(n) {
    var id = global.myWorkerId;
	var div = (n / global.nWorkers)|0;
	var rem = n % global.nWorkers;

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
 * Test if the variable x is null or undefined
 *
 * @ignore
 * @param x variable to be tested
 * @return {boolean} true if x is null or undefined
 */
MathWorkers.util.nullOrUndefined = function(x) {
    return x === undefined || x === null;
};

/**
 * Verify that x is neither null nor undefined.
 *
 * @ignore
 * @throws {TypeError}
 */
MathWorkers.util.checkNullOrUndefined = function(x) {
    if (MathWorkers.util.nullOrUndefined(x)) {
        throw new TypeError("Undefined or null variable.");
    }
};

/**
 * Verify that x is a Number and not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 */
MathWorkers.util.checkNumber = function(x) {
    MathWorkers.util.checkNullOrUndefined(x);
    if (typeof x != 'number') {
        throw new TypeError("Expected type Number but is type " + typeof x);
    }
};

/**
 * Verify that x is a Function and not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 */
MathWorkers.util.checkFunction = function(x) {
    MathWorkers.util.checkNullOrUndefined(x);
    if (typeof x != 'function') {
        throw new TypeError("Expected type Function but is type " + typeof x);
    }
};

/**
 * Verify that x is an Array or Float64Array and not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 */
MathWorkers.util.checkArray = function(x) {
    MathWorkers.util.checkNullOrUndefined(x);
    if (!(x instanceof Array || x instanceof Float64Array)) {
        throw new TypeError("Expected type Array but is type " + typeof x);
    }
};

/**
 * Verify that x is a Float64Array and not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 */
MathWorkers.util.checkFloat64Array = function(x) {
    MathWorkers.util.checkNullOrUndefined(x);
    if (!(x instanceof Float64Array)) {
        throw new TypeError("Expected type Float64Array but is type " + typeof x);
    }
};

/**
 * Verify that v is a Vector and is not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 */
MathWorkers.util.checkVector = function(v) {
    MathWorkers.util.checkNullOrUndefined(v);
    if (!(v instanceof MathWorkers.Vector)) {
        throw new TypeError("Expected type Vector but is not.");
    }
};

/**
 * Verify that Vectors v and w are equal length and not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 * @throws {Error}
 */
MathWorkers.util.checkVectors = function(v, w) {
    MathWorkers.util.checkVector(v);
    MathWorkers.util.checkVector(w);
    if (v.length !== w.length) {
        throw new Error("Vectors have unequal lengths.");
    }
};

/**
 * Verify that Vector v and Matrix A are compatible for vector-matrix products
 * and are both not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 * @throws {Error}
 */
MathWorkers.util.checkVectorMatrix = function(v, A) {
    MathWorkers.util.checkVector(v);
    MathWorkers.util.checkMatrix(A);
    if (v.length !== A.nrows) {
        throw new Error("Vector length and number Matrix rows are unequal.");
    }
};

/**
 * Verify that A is a Matrix and is not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 */
MathWorkers.util.checkMatrix = function(A) {
    MathWorkers.util.checkNullOrUndefined(A);
    if (!(A instanceof MathWorkers.Matrix)) {
        throw new TypeError("Expected type Matrix but is not.");
    }
};

/**
 * Verify that Matrix A and Matrix B have equal dimensions and are neither null nor undefined
 *
 * @ignore
 * @throws {TypeError}
 * @throws {Error}
 */
MathWorkers.util.checkMatrices = function(A, B) {
    MathWorkers.util.checkMatrix(A);
    MathWorkers.util.checkMatrix(B);
    if (!(A.nrows === B.nrows && A.ncols === B.ncols)) {
        throw new Error("Matrices do not have equal numbers of rows and columns.");
    }
};

/**
 * Verify that Matrix A and Vector v are compatible for matrix-vector products
 * and are both not null or undefined
 *
 * @ignore
 * @throws {TypeError}
 * @throws {Error}
 */
MathWorkers.util.checkMatrixVector = function(A, v) {
    MathWorkers.util.checkMatrix(A);
    MathWorkers.util.checkVector(v);
    if (v.length !== A.ncols) {
        throw new Error("Vector length and number Matrix columns are unequal.");
    }
};

/**
 * Verify that Matrix A and Matrix B have compatible dimensions for matrix-matrix
 * multiplication and are neither null nor undefined
 *
 * @ignore
 * @throws {TypeError}
 * @throws {Error}
 */
MathWorkers.util.checkMatrixMatrix = function(A, B) {
    MathWorkers.util.checkMatrix(A);
    MathWorkers.util.checkMatrix(B);
    if (A.ncols !== B.nrows) {
        throw new Error("Matrices do not have compatible dimensions for matrix-matrix multiplication.");
    }
};


/**
 * Convenience function to get the values of an object/map
 *
 * @ignore
 */
MathWorkers.util.mapValues = function(m) {
    var vals = [];
    for (var key in m) {
        if (m.hasOwnProperty(key)) {
            vals.push(m[key]);
        }
    }
    return vals;
};


/**
 * Convert and ArrayBuffer to a String
 *
 * compliments of: http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
 *
 * @ignore
 * @param buf {ArrayBuffer} ArrayBuffer to convert
 * @returns {string} the resulting string
 */
MathWorkers.util.ab2str = function(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
};

/**
 * Convert a String to an ArrayBuffer
 *
 * compliments of: http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
 *
 * @ignore
 * @param str {string} String to convert
 * @returns {ArrayBuffer} the resulting ArrayBuffer
 */
MathWorkers.util.str2ab = function(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};
