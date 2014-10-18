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
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkMinus = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
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
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkTimes = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
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
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkDivide = function(B, tag, rebroadcast) {
    MW.util.checkMatrices(this, B);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
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

MW.Matrix.prototype.wkScale = function(alpha, tag, rebroadcast) {
    MW.util.checkNumber(alpha);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
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
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkApply = function(fn, tag, rebroadcast) {
    MW.util.checkFunction(fn);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
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
    MW.MathWorker.gatherMatrixRows(C, this.nrows, lb.ifrom, tag, rebroadcast);
};

// matrix-vector multiply: A.v
MW.Matrix.prototype.wkDotVector = function(v, tag, rebroadcast) {
    MW.util.checkMatrixVector(this, v);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.nrows);
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
                tot += ai[j] * v.array[j]
                    + ai[j+1] * v.array[j+1]
                    + ai[j+2] * v.array[j+2]
                    + ai[j+3] * v.array[j+3];
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
                        + ai[j+1] * Bk[j+1]
                        + ai[j+2] * Bk[j+2]
                        + ai[j+3] * Bk[j+3];
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