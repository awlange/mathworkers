// Copyright 2014 Adrian W. Lange

/*
 * Parallel worker versions of the Vector methods
 */

/**
 * Compute the sum of all elements in the Vector in parallel
 *
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerSum = function(tag, rebroadcast) {
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var tot = 0.0;
    var i;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            tot += this.array[i] + this.array[i+1] + this.array[i+2] + this.array[i+3];
        }
        for (; i < lb.ito; ++i) {
            tot += this.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot += this.array[i];
        }
    }
    MathWorkers.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

/**
 * Compute the product of all elements in the Vector in parallel
 *
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerProduct = function(tag, rebroadcast) {
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var tot = 1.0;
    var i;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            tot *= this.array[i] * this.array[i+1] * this.array[i+2] * this.array[i+3];
        }
        for (; i < lb.ito; ++i) {
            tot *= this.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot *= this.array[i];
        }
    }
    MathWorkers.MathWorker.reduceVectorProduct(tot, tag, rebroadcast);
};


/**
 * Add this Vector to another (element-wise) in parallel.
 *
 * @param {!MathWorkers.Vector} w the Vector to add with this Vector
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerPlus = function(w, tag, rebroadcast) {
    MathWorkers.util.checkVectors(this, w);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    var i;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            x[offset++] = this.array[i] + w.array[i];
            x[offset++] = this.array[i+1] + w.array[i+1];
            x[offset++] = this.array[i+2] + w.array[i+2];
            x[offset++] = this.array[i+3] + w.array[i+3];
        }
        for (; i < lb.ito; ++i) {
            x[offset++] = this.array[i] + w.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] = this.array[i] + w.array[i];
        }
    }
    MathWorkers.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

/**
 * Subtract another Vector from this Vector (element-wise) in parallel.
 *
 * @param {!MathWorkers.Vector} w the Vector to subtract from this Vector
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerMinus = function(w, tag, rebroadcast) {
    MathWorkers.util.checkVectors(this, w);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    var i;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            x[offset++] = this.array[i] - w.array[i];
            x[offset++] = this.array[i+1] - w.array[i+1];
            x[offset++] = this.array[i+2] - w.array[i+2];
            x[offset++] = this.array[i+3] - w.array[i+3];
        }
        for (; i < lb.ito; ++i) {
            x[offset++] = this.array[i] - w.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] = this.array[i] - w.array[i];
        }
    }
    MathWorkers.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

/**
 * Multiply this Vector with another (element-wise) in parallel.
 *
 * @param {!MathWorkers.Vector} w the Vector to multiply with this Vector
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerTimes = function(w, tag, rebroadcast) {
    MathWorkers.util.checkVectors(this, w);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    var i;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            x[offset++] = this.array[i] * w.array[i];
            x[offset++] = this.array[i+1] * w.array[i+1];
            x[offset++] = this.array[i+2] * w.array[i+2];
            x[offset++] = this.array[i+3] * w.array[i+3];
        }
        for (; i < lb.ito; ++i) {
            x[offset++] = this.array[i] * w.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] = this.array[i] * w.array[i];
        }
    }
    MathWorkers.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

/**
 * Divide this Vector to another (element-wise) in parallel.
 *
 * @param {!MathWorkers.Vector} w the Vector to divide this Vector by
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerDivide = function(w, tag, rebroadcast) {
    MathWorkers.util.checkVectors(this, w);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    var i;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            x[offset++] = this.array[i] / w.array[i];
            x[offset++] = this.array[i+1] / w.array[i+1];
            x[offset++] = this.array[i+2] / w.array[i+2];
            x[offset++] = this.array[i+3] / w.array[i+3];
        }
        for (; i < lb.ito; ++i) {
            x[offset++] = this.array[i] / w.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] = this.array[i] / w.array[i];
        }
    }
    MathWorkers.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

/**
 * Multiply all elements of this Vector by a scalar in parallel.
 *
 * @param {!number} alpha the scalar to multiply by
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerScale = function(alpha, tag, rebroadcast) {
    MathWorkers.util.checkNumber(alpha);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    var i;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            x[offset++] = this.array[i] * alpha;
            x[offset++] = this.array[i+1] * alpha;
            x[offset++] = this.array[i+2] * alpha;
            x[offset++] = this.array[i+3] * alpha;
        }
        for (; i < lb.ito; ++i) {
            x[offset++] = this.array[i] * alpha;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] = this.array[i] * alpha;
        }
    }
    MathWorkers.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

/**
 * Apply (or, map) a function onto each value in this Vector in parallel. The function must take a number as its
 * argument and return a number. That is, the function must map a number to a number.
 *
 * @param {!function} fn the function to be applied to each element of this Vector
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerApply = function(fn, tag, rebroadcast) {
    MathWorkers.util.checkFunction(fn);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    var i;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            x[offset++] = fn(this.array[i]);
            x[offset++] = fn(this.array[i+1]);
            x[offset++] = fn(this.array[i+2]);
            x[offset++] = fn(this.array[i+3]);
        }
        for (; i < lb.ito; ++i) {
            x[offset++] = fn(this.array[i]);
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] = fn(this.array[i]);
        }
    }
    MathWorkers.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

/**
 * Compute the dot product of this Vector with another Vector in parallel.
 *
 * @param {!MathWorkers.Vector} w the other Vector to be dotted with this Vector
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerDotVector = function(w, tag, rebroadcast) {
    MathWorkers.util.checkVectors(this, w);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.length);
    var i;
    var tot = 0.0;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; i += 4) {
            tot += this.array[i] * w.array[i] +
                this.array[i+1] * w.array[i+1] +
                this.array[i+2] * w.array[i+2] +
                this.array[i+3] * w.array[i+3];
        }
        for (; i < lb.ito; ++i) {
            tot += this.array[i] * w.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot += this.array[i] * w.array[i];
        }
    }
    MathWorkers.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

/**
 * Compute the vector-matrix product of this Vector with a Matrix in parallel.
 * It is assumed that this Vector is transposed such that it is a row vector.
 * The ordering is such that this Vector v A and the Matrix is A: v.A
 *
 * @param {!MathWorkers.Matrix} A the matrix to multiply with
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Vector
 */
MathWorkers.Vector.prototype.workerDotMatrix = function(A, tag, rebroadcast) {
    MathWorkers.util.checkVectorMatrix(this, A);
    MathWorkers.util.checkNullOrUndefined(tag);
    var i, j, tot;
    var nj = this.length;
    var lb = MathWorkers.util.loadBalance(A.ncols);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
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
            w[offset++] = tot;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot = 0.0;
            for (j = 0; j < nj; ++j) {
                tot += this.array[j] * A.array[j][i];
            }
            w[offset++] = tot;
        }
    }
    MathWorkers.MathWorker.gatherVector(w, this.length, lb.ifrom, tag, rebroadcast);
};

