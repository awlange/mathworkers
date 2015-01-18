// Copyright 2014 Adrian W. Lange

/*
 * Parallel worker versions of the Matrix methods
 */

/**
 * Add this Matrix to another (element-wise) in parallel.
 *
 * @param {!MathWorkers.Matrix} B the Matrix to add to this Matrix
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.workerPlus = function(B, tag, rebroadcast) {
    MathWorkers.util.checkMatrices(this, B);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    var i, j, ai, bi, co;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            bi = B.array[i];
            co = C[offset];
            for (j = 0; j < nj3; j += 4) {
                co[j] = ai[j] + bi[j];
                co[j+1] = ai[j+1] + bi[j+1];
                co[j+2] = ai[j+2] + bi[j+2];
                co[j+3] = ai[j+3] + bi[j+3];
            }
            for (; j < nj; ++j) {
                co[j] = ai[j] + bi[j];
            }
            ++offset;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            bi = B.array[i];
            co = C[offset];
            for (j = 0; j < nj; ++j) {
                co[j] = ai[j] + bi[j];
            }
            ++offset;
        }
    }
    MathWorkers.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

/**
 * Subtract another Matrix from this Matrix (element-wise) in parallel.
 *
 * @param {!MathWorkers.Matrix} B the Matrix to subtract from this Matrix
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.workerMinus = function(B, tag, rebroadcast) {
    MathWorkers.util.checkMatrices(this, B);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    var i, j, ai, bi, co;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            bi = B.array[i];
            co = C[offset];
            for (j = 0; j < nj3; j += 4) {
                co[j] = ai[j] - bi[j];
                co[j+1] = ai[j+1] - bi[j+1];
                co[j+2] = ai[j+2] - bi[j+2];
                co[j+3] = ai[j+3] - bi[j+3];
            }
            for (; j < nj; ++j) {
                co[j] = ai[j] - bi[j];
            }
            ++offset;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            bi = B.array[i];
            co = C[offset];
            for (j = 0; j < nj; ++j) {
                co[j] = ai[j] - bi[j];
            }
            ++offset;
        }
    }
    MathWorkers.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

/**
 * Multiply this Matrix with another (element-wise) in parallel.
 *
 * @param {!MathWorkers.Matrix} B the Matrix to multiply with this Matrix
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.workerTimes = function(B, tag, rebroadcast) {
    MathWorkers.util.checkMatrices(this, B);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    var i, j, ai, bi, co;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            bi = B.array[i];
            co = C[offset];
            for (j = 0; j < nj3; j += 4) {
                co[j] = ai[j] * bi[j];
                co[j+1] = ai[j+1] * bi[j+1];
                co[j+2] = ai[j+2] * bi[j+2];
                co[j+3] = ai[j+3] * bi[j+3];
            }
            for (; j < nj; ++j) {
                co[j] = ai[j] * bi[j];
            }
            ++offset;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            bi = B.array[i];
            co = C[offset];
            for (j = 0; j < nj; ++j) {
                co[j] = ai[j] * bi[j];
            }
            ++offset;
        }
    }
    MathWorkers.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

/**
 * Divide this Matrix by another (element-wise) in parallel.
 *
 * @param {!MathWorkers.Matrix} B the Matrix to divide this Matrix by
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.workerDivide = function(B, tag, rebroadcast) {
    MathWorkers.util.checkMatrices(this, B);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    var i, j, ai, bi, co;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            bi = B.array[i];
            co = C[offset];
            for (j = 0; j < nj3; j += 4) {
                co[j] = ai[j] / bi[j];
                co[j+1] = ai[j+1] / bi[j+1];
                co[j+2] = ai[j+2] / bi[j+2];
                co[j+3] = ai[j+3] / bi[j+3];
            }
            for (; j < nj; ++j) {
                co[j] = ai[j] / bi[j];
            }
            ++offset;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            bi = B.array[i];
            co = C[offset];
            for (j = 0; j < nj; ++j) {
                co[j] = ai[j] / bi[j];
            }
            ++offset;
        }
    }
    MathWorkers.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

/**
 * Multiply all elements of this Matrix by a scalar in parallel.
 *
 * @param {!number} alpha the scalar to multiply by
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.workerScale = function(alpha, tag, rebroadcast) {
    MathWorkers.util.checkNumber(alpha);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    var i, j, ai, co;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            co = C[offset];
            for (j = 0; j < nj3; j += 4) {
                co[j] = ai[j] * alpha;
                co[j+1] = ai[j+1] * alpha;
                co[j+2] = ai[j+2] * alpha;
                co[j+3] = ai[j+3] * alpha;
            }
            for (; j < nj; ++j) {
                co[j] = ai[j] * alpha;
            }
            ++offset;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            co = C[offset];
            for (j = 0; j < nj; ++j) {
                co[j] = ai[j] * alpha;
            }
            ++offset;
        }
    }
    MathWorkers.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

/**
 * Apply (or, map) a function onto each value in this Matrix in parallel. The function must take a number as its
 * argument and return a number. That is, the function must map a number to a number.
 *
 * @param {!function} fn the function to be applied to each element of this Matrix
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.workerApply = function(fn, tag, rebroadcast) {
    MathWorkers.util.checkFunction(fn);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    var i, j, ai, co;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            co = C[offset];
            for (j = 0; j < nj3; j += 4) {
                co[j] = fn(ai[j]);
                co[j+1] = fn(ai[j+1]);
                co[j+2] = fn(ai[j+2]);
                co[j+3] = fn(ai[j+3]);
            }
            for (; j < nj; ++j) {
                co[j] = fn(ai[j]);
            }
            ++offset;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            C.push(new Float64Array(nj));
            ai = this.array[i];
            co = C[offset];
            for (j = 0; j < nj; ++j) {
                co[j] = fn(ai[j]);
            }
            ++offset;
        }
    }
    MathWorkers.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

/**
 * Compute the matrix-vector product of this Matrix with a Vector in parallel.
 * It is assumed that this Vector is transposed such that it is a column vector.
 * The ordering is such that this Matrix is A and the Vector is v: A.v
 *
 * @param {!MathWorkers.Vector} v the Vector to be multiplied with
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.workerDotVector = function(v, tag, rebroadcast) {
    MathWorkers.util.checkMatrixVector(this, v);
    MathWorkers.util.checkNullOrUndefined(tag);
    var lb = MathWorkers.util.loadBalance(this.nrows);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var i, j, tot, ai;
    var nj = this.ncols;
    var offset = 0;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
            ai = this.array[i];
            tot = 0.0;
            for (j = 0; j < nj3; j += 4) {
                tot += ai[j] * v.array[j] +
                    ai[j+1] * v.array[j+1] +
                    ai[j+2] * v.array[j+2] +
                    ai[j+3] * v.array[j+3];
            }
            for (; j < nj; ++j) {
                tot += ai[j] * v.array[j];
            }
            w[offset++] = tot;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            ai = this.array[i];
            tot = 0.0;
            for (j = 0; j < nj; ++j) {
                tot += ai[j] * v.array[j];
            }
            w[offset++] = tot;
        }
    }
    MathWorkers.MathWorker.gatherVector(w, v.length, lb.ifrom, tag, rebroadcast);
};

/**
 * Compute the matrix-matrix product of this Matrix with another Matrix in parallel. The ordering
 * is such that this Matrix is A and the other matrix is B: A.B
 *
 * @param {!MathWorkers.Matrix} B the Matrix to multiply with this Matrix
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.workerDotMatrix = function(B, tag, rebroadcast) {
    MathWorkers.util.checkMatrixMatrix(this, B);
    MathWorkers.util.checkNullOrUndefined(tag);

    var i, j, k, tot, ai;
    var ni = this.nrows;
    var nj = this.ncols;
    var lb = MathWorkers.util.loadBalance(B.ncols);
    var nk = lb.ito - lb.ifrom;

    // transposed
    var C = new Array(nk);
    for (k = 0; k < nk; ++k) {
        C[k] = new Float64Array(ni);
    }

    var Bk = new Float64Array(nj);
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (k = 0; k < nk; ++k) {
            B.copyColumn(lb.ifrom + k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                ai = this.array[i];
                for (j = 0; j < nj3; j += 4) {
                    tot += ai[j] * Bk[j] +
                        ai[j+1] * Bk[j+1] +
                        ai[j+2] * Bk[j+2] +
                        ai[j+3] * Bk[j+3];
                }
                for (; j < nj; ++j) {
                    tot += ai[j] * Bk[j];
                }
                C[k][i] = tot;
            }
        }
    } else {
        for (k = 0; k < nk; ++k) {
            B.copyColumn(lb.ifrom + k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                ai = this.array[i];
                for (j = 0; j < nj; ++j) {
                    tot += ai[j] * Bk[j];
                }
                C[k][i] = tot;
            }
        }
    }

    MathWorkers.MathWorker.gatherMatrixColumns(C, this.nrows, B.ncols, lb.ifrom, tag, rebroadcast);
};

