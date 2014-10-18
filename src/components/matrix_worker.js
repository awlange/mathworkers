// Copyright 2014 Adrian W. Lange

/**
 * Worker versions of the Matrix methods
 */

MW.Matrix.prototype.wkPlus = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] + B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkMinus = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] - B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkTimes = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] * B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkDivide = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] / B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkScale = function(alpha, tag, rebroadcast) {
    MW.util.checkNumber(alpha);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = alpha * this.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkApply = function(fn, tag, rebroadcast) {
    MW.util.checkFunction(fn);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = fn(this.array[i][j]);
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

// matrix-vector multiply: A.v
MW.Matrix.prototype.wkDotVector = function(v, tag, rebroadcast) {
    MW.util.checkMatrixVector(this, v);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.ncols; ++j) {
            tot += this.array[i][j] * v.array[j];
        }
        w[offset++] = tot;
    }
    MW.MathWorker.gatherVector(w, v.length, lb.ifrom, tag, rebroadcast);
};

// C = A.B
MW.Matrix.prototype.wkDotMatrix = function(B, tag, rebroadcast) {
    MW.util.checkMatrixMatrix(this, B);
    MW.util.checkNullOrUndefined(tag);

    var i, j, k, tot, ai;
    var ni = this.nrows;
    var nj = this.ncols;
    var lb = MW.util.loadBalance(B.ncols);
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
                    tot += ai[j] * Bk[j]
                        + ai[j + 1] * Bk[j + 1]
                        + ai[j + 2] * Bk[j + 2]
                        + ai[j + 3] * Bk[j + 3];
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

    MW.MathWorker.gatherMatrixColumns(C, this.nrows, B.ncols, lb.ifrom, tag, rebroadcast);
};