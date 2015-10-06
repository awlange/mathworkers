// Copyright 2014 Adrian W. Lange

/**
 * Vector class.
 * A wrapper around a Float64Array with several vector operations defined, including worker
 * parallelized operations.
 *
 * @param {number} [size] the length of the Vector being constructed. If not provided or less than 1,
 *                        a Vector object is still created but with a null array.
 * @constructor
 * @memberof MathWorkers
 */
MathWorkers.Vector = function(size) {

    /**
     * The underlying Float64Array for a Vector
     *
     * @member {Float64Array}
     */
    this.array = null;

    /**
     * The size of the Vector's Float64Array
     *
     * @member {number}
     */
    this.length = size || 0;
    if (size > 0) {
        this.array = new Float64Array(size);
    }
};

/**
 * Create a new Vector object from a provided array of numbers. Deep copies the array.
 *
 * @param {!Array.<number> | !Float64Array} arr the number array to be copied
 * @returns {MathWorkers.Vector} the new Vector object
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.fromArray = function(arr) {
    MathWorkers.util.checkArray(arr);
    var vec = new MathWorkers.Vector(arr.length);
    for (var i = 0, ni = arr.length; i < ni; ++i) {
        vec.array[i] = arr[i];
    }
    return vec;
};

/**
 * Assign the underlying Float64Array for this Vector
 *
 * @param {!Float64Array} arr the Float64Array to be assigned to this Vector object
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.setVector = function(arr) {
    MathWorkers.util.checkFloat64Array(arr);
    this.array = arr;
    this.length = arr.length;
};

/**
 * Create a new Vector object populated with all zero values
 *
 * @param {!number} size the length of the Vector to be created
 * @returns {MathWorkers.Vector} the new zeroed Vector
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.zeroes = function(size) {
    var vec = new MathWorkers.Vector(size);
    for (var i = 0; i < size; ++i) {
        vec.array[i] = 0.0;
    }
    return vec;
};

/**
 * Create a new Vector object populated with random values between 0 and 1
 *
 * @param {!number} size the length of the Vector to be created
 * @returns {MathWorkers.Vector} the new random Vector
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.randomVector = function(size) {
    var vec = new MathWorkers.Vector(size);
    for (var i = 0; i < size; ++i) {
        vec.array[i] = Math.random();
    }
    return vec;
};

/**
 * Convert the Vector data into a printable string
 *
 * @returns {string} the string representation of the Vector
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.toString = function() {
    var str = "[";
    for (var i = 0; i < this.length - 1; ++i) {
        str += this.array[i] + ", ";
    }
    return str + this.array[this.length-1] + "]";
};

/**
 * Compute the sum of all elements in the Vector
 *
 * @returns {number} the sum of all elements
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.sum = function() {
    var result = 0.0;
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result += this.array[i] + this.array[i+1] + this.array[i+2] + this.array[i+3];
        }
        for (; i < ni; ++i) {
            result += this.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result += this.array[i];
        }
    }
    return result;
};

/**
 * Compute the product of all elements in the Vector
 *
 * @returns {number} the product of all elements
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.product = function() {
    var result = 1.0;
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result *= this.array[i] * this.array[i+1] * this.array[i+2] * this.array[i+3];
        }
        for (; i < ni; ++i) {
            result *= this.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result *= this.array[i];
        }
    }
    return result;
};

/**
 * Add this Vector to another (element-wise).
 *
 * @param {MathWorkers.Vector} w the Vector to add with this Vector
 * @returns {MathWorkers.Vector} the element-wise sum of this Vector with w
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.plus = function(w) {
    MathWorkers.util.checkVectors(this, w);
    var result = new MathWorkers.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] + w.array[i];
            result.array[i+1] = this.array[i+1] + w.array[i+1];
            result.array[i+2] = this.array[i+2] + w.array[i+2];
            result.array[i+3] = this.array[i+3] + w.array[i+3];
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] + w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] + w.array[i];
        }
    }
    return result;
};

/**
 * Subtract another Vector from this Vector (element-wise).
 *
 * @param {MathWorkers.Vector} w the Vector to subtract from this Vector
 * @returns {MathWorkers.Vector} the element-wise difference of w from this Vector
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.minus = function(w) {
    MathWorkers.util.checkVectors(this, w);
    var result = new MathWorkers.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] - w.array[i];
            result.array[i+1] = this.array[i+1] - w.array[i+1];
            result.array[i+2] = this.array[i+2] - w.array[i+2];
            result.array[i+3] = this.array[i+3] - w.array[i+3];
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] - w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] - w.array[i];
        }
    }
    return result;
};

/**
 * Multiply this Vector with another (element-wise).
 *
 * @param {MathWorkers.Vector} w the Vector to multiply with this Vector
 * @returns {MathWorkers.Vector} the element-wise product of this Vector with w
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.times = function(w) {
    MathWorkers.util.checkVectors(this, w);
    var result = new MathWorkers.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] * w.array[i];
            result.array[i+1] = this.array[i+1] * w.array[i+1];
            result.array[i+2] = this.array[i+2] * w.array[i+2];
            result.array[i+3] = this.array[i+3] * w.array[i+3];
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] * w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] * w.array[i];
        }
    }
    return result;
};

/**
 * Divide this Vector by another (element-wise).
 *
 * @param {MathWorkers.Vector} w the Vector to divide this Vector by
 * @returns {MathWorkers.Vector} the element-wise quotient of this Vector by w
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.divide = function(w) {
    MathWorkers.util.checkVectors(this, w);
    var result = new MathWorkers.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] / w.array[i];
            result.array[i+1] = this.array[i+1] / w.array[i+1];
            result.array[i+2] = this.array[i+2] / w.array[i+2];
            result.array[i+3] = this.array[i+3] / w.array[i+3];
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] / w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] / w.array[i];
        }
    }
    return result;
};

/**
 * Multiply all elements of this Vector by a scalar.
 *
 * @param {!number} alpha the scalar to multiply by
 * @returns {MathWorkers.Vector} the scaled Vector
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.scale = function(alpha) {
    MathWorkers.util.checkNumber(alpha);
    var result = new MathWorkers.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] * alpha;
            result.array[i+1] = this.array[i+1] * alpha;
            result.array[i+2] = this.array[i+2] * alpha;
            result.array[i+3] = this.array[i+3] * alpha;
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] * alpha;
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] * alpha;
        }
    }
    return result;
};

/**
 * Apply (or, map) a function onto each value in this Vector. The function must take a number as its argument and
 * return a number. That is, the function must map a number to a number.
 *
 * @param {!function} fn the function to be applied to each element of the Vector
 * @returns {MathWorkers.Vector} the mapped Vector
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.apply = function(fn) {
    MathWorkers.util.checkFunction(fn);
    var result = new MathWorkers.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = fn(this.array[i]);
            result.array[i+1] = fn(this.array[i+1]);
            result.array[i+2] = fn(this.array[i+2]);
            result.array[i+3] = fn(this.array[i+3]);
        }
        for (; i < ni; ++i) {
            result.array[i] = fn(this.array[i]);
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = fn(this.array[i]);
        }
    }
    return result;
};

/**
 * Compute the dot product of this Vector with another Vector.
 *
 * @param {!MathWorkers.Vector} w the other Vector to be dotted with this Vector
 * @returns {number} the resulting dot product value
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.dotVector = function(w) {
    MathWorkers.util.checkVectors(this, w);
    var i;
    var ni = this.length;
    var tot = 0.0;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            tot += this.array[i] * w.array[i] +
                this.array[i+1] * w.array[i+1] +
                this.array[i+2] * w.array[i+2] +
                this.array[i+3] * w.array[i+3];
        }
        for (; i < ni; ++i) {
            tot += this.array[i] * w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            tot += this.array[i] * w.array[i];
        }
    }
    return tot;
};

/**
 * Compute the vector-matrix product of this Vector with a Matrix.
 * It is assumed that this Vector is transposed such that it is a row vector.
 * The ordering is such that this Vector v A and the Matrix is A: v.A
 *
 * @param {!MathWorkers.Matrix} A the matrix to multiply with
 * @returns {MathWorkers.Vector} the resulting Vector of the vector-matrix product
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.dotMatrix = function(A) {
    MathWorkers.util.checkVectorMatrix(this, A);
    var i, j, tot;
    var ni = A.ncols;
    var nj = this.length;
    var w = new MathWorkers.Vector(ni);
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
            tot = 0.0;
            for (j = 0; j < nj3; j += 4) {
                tot += this.array[j] * A.array[j][i] +
                    this.array[j+1] * A.array[j+1][i] +
                    this.array[j+2] * A.array[j+2][i] +
                    this.array[j+3] * A.array[j+3][i];
            }
            for (; j < nj; ++j) {
                tot += this.array[j] * A.array[j][i];
            }
            w.array[i] = tot;
        }
    } else {
        for (i = 0; i < ni; ++i) {
            tot = 0.0;
            for (j = 0; j < nj; ++j) {
                tot += this.array[j] * A.array[j][i];
            }
            w.array[i] = tot;
        }
    }
    return w;
};


