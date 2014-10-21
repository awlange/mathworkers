// Copyright 2014 Adrian W. Lange

/**
 *  General utility functions intended for internal use
 */
MW.util = {};

/**
 * Verify that the environment executing this code has Web Worker support
 */
MW.util.checkWebWorkerSupport = function() {
    if (typeof(Worker) === "undefined") {
        throw Error("Web Worker support not available for MathWorkers.");
    }
};

/**
 * Load balancing function.
 * Divides n up evenly among the number of workers in the pool.
 * Any remainder is distributed such that no worker has more than 1 extra piece in its range.
 */
MW.util.loadBalance = function(n) {
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
 *  True if x is null or undefined
 */
MW.util.nullOrUndefined = function(x) {
    return x === undefined || x === null;
};

/**
 *  Verify that x is neither null nor undefined.
 */
MW.util.checkNullOrUndefined = function(x) {
    if (MW.util.nullOrUndefined(x)) {
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

/**
 *  Verify that v is a Vector and is not null or undefined
 */
MW.util.checkVector = function(v) {
    MW.util.checkNullOrUndefined(v);
    if (!(v instanceof MW.Vector)) {
        throw new TypeError("Expected type Vector but is not.");
    }
};

/**
 *  Verify that Vectors v and w are equal length and not null or undefined
 */
MW.util.checkVectors = function(v, w) {
    MW.util.checkVector(v);
    MW.util.checkVector(w);
    if (v.length !== w.length) {
        throw new Error("Vectors have unequal lengths.");
    }
};

/**
 *  Verify that Vector v and Matrix A are compatible for vector-matrix products
 *  and are both not null or undefined
 */
MW.util.checkVectorMatrix = function(v, A) {
    MW.util.checkVector(v);
    MW.util.checkMatrix(A);
    if (v.length !== A.nrows) {
        throw new Error("Vector length and number Matrix rows are unequal.");
    }
};

/**
 *  Verify that A is a Matrix and is not null or undefined
 */
MW.util.checkMatrix = function(A) {
    MW.util.checkNullOrUndefined(A);
    if (!(A instanceof MW.Matrix)) {
        throw new TypeError("Expected type Matrix but is not.");
    }
};

/**
 *  Verify that Matrix A and Matrix B have equal dimensions and are neither null nor undefined
 */
MW.util.checkMatrices = function(A, B) {
    MW.util.checkMatrix(A);
    MW.util.checkMatrix(B);
    if (!(A.nrows === B.nrows && A.ncols === B.ncols)) {
        throw new Error("Matrices do not have equal numbers of rows and columns.");
    }
};

/**
 *  Verify that Matrix A and Vector v are compatible for matrix-vector products
 *  and are both not null or undefined
 */
MW.util.checkMatrixVector = function(A, v) {
    MW.util.checkMatrix(A);
    MW.util.checkVector(v);
    if (v.length !== A.ncols) {
        throw new Error("Vector length and number Matrix columns are unequal.");
    }
};

/**
 *  Verify that Matrix A and Matrix B have compatible dimensions for matrix-matrix
 *  multiplication and are neither null nor undefined
 */
MW.util.checkMatrixMatrix = function(A, B) {
    MW.util.checkMatrix(A);
    MW.util.checkMatrix(B);
    if (A.ncols !== B.nrows) {
        throw new Error("Matrices do not have compatible dimensions for matrix-matrix multiplication.");
    }
};

