// Copyright 2014 Adrian W. Lange

/**
 *  Matrix class
 *
 *  A wrapper around an array of Float64Array objects
 */
MW.Matrix = function(nrows, ncols) {
    this.array = [];
    this.nrows = nrows || 0;
    this.ncols = ncols || 0;

    if (nrows > 0 && ncols > 0) {
        this.array = new Array(nrows);
        for (var r = 0; r < nrows; ++r) {
            this.array[r] = new Float64Array(ncols);
        }
    }
};

// Deep copy the array
MW.Matrix.fromArray = function(arr) {
    MW.util.checkArray(arr);
    var mat = new MW.Matrix(arr.length, arr[0].length);
    for (var i = 0; i < arr.length; ++i) {
        for (var j = 0; j < arr[i].length; ++j) {
            mat.array[i][j] = arr[i][j];
        }
    }
    return mat;
};

MW.Matrix.prototype.setMatrix = function(arr) {
    MW.util.checkArray(arr);
    MW.util.checkFloat64Array(arr[0]);
    this.array = arr;
    this.nrows = arr.length;
    this.ncols = arr[0].length;
};

MW.Matrix.prototype.copyColumn = function(j, vec) {
    for (var i = 0, ni = this.nrows; i < ni; ++i) {
        vec[i] = this.array[i][j];
    }
};

MW.Matrix.prototype.copyRow = function(i, vec) {
    for (var j = 0, nj = this.ncols; j < nj; ++j) {
        vec[j] = this.array[i][j];
    }
};

MW.Matrix.prototype.isSquare = function() {
    return this.nrows == this.ncols;
};

MW.Matrix.zeroes = function(n, m) {
    var mat = new MW.Matrix(n, m);
    for (var i = 0; i < n; ++i) {
        for (var j = 0; j < m; ++j) {
            mat.array[i][j] = 0.0;
        }
    }
    return mat;
};

MW.Matrix.identity = function(n) {
    var mat = new MW.Matrix(n, n);
    for (var i = 0; i < n; ++i) {
        for (var j = 0; j < n; ++j) {
            mat.array[i][j] = 0.0;
        }
        mat.array[i][i] = 1.0;
    }
    return mat;
};

MW.Matrix.randomMatrix = function(nrows, ncols) {
    var mat = new Matrix(nrows, ncols);
    for (var i = 0; i < nrows; ++i) {
        for (var j = 0; j < ncols; ++j) {
            mat.array[i][j] = Math.random();
        }
    }
    return mat;
};

MW.Matrix.prototype.toString = function() {
    var str = "";
    for (var i = 0; i < this.nrows; ++i) {
        var row = "[";
        for (var j = 0; j < this.ncols - 1; ++j) {
            row += this.array[i][j] + ", ";
        }
        str += row + this.array[i][this.ncols-1] + "]";
        if (i != this.nrows - 1) {
            str += "\n";
        }
    }
    return str;
};

MW.Matrix.prototype.plus = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] + B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.minus = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] - B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.timesElementwise = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] * B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.divide = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] / B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.scale = function(alpha) {
    MW.util.checkNumber(alpha);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] * alpha;
        }
    }
    return C;
};

MW.Matrix.prototype.apply = function(fn) {
    MW.util.checkFunction(fn);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = fn(this.array[i][j]);
        }
    }
    return C;
};

// Allocate new matrix and return to allow for arbitrary shaped matrices
MW.Matrix.prototype.transpose = function() {
    var B = new MW.Matrix(this.ncols, this.nrows);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            B.array[j][i] = this.array[i][j];
        }
    }
    return B;
};

// Only works for square matrices
MW.Matrix.prototype.transposeInPlace = function() {
    if (this.isSquare()) {
        for (var i = 0; i < this.nrows; ++i) {
            for (var j = i + 1; j < this.ncols; ++j) {
                var tmp = this.array[i][j];
                this.array[i][j] = this.array[j][i];
                this.array[j][i] = tmp;
            }
        }
    }
    return this;
};

// matrix-vector multiply: A.v
MW.Matrix.prototype.timesVector = function(v) {
    MW.util.checkMatrixVector(this, v);
    var w = new MW.Vector(this.nrows);
    for (var i = 0; i < this.nrows; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.ncols; ++j) {
            tot += this.array[i][j] * v.array[j];
        }
        w.array[i] = tot;
    }
    return w;
};

// matrix-matrix multiply: A.B
MW.Matrix.prototype.timesMatrix = function(B) {
    MW.util.checkMatrixMatrix(this, B);
    var C = new MW.Matrix(this.nrows, B.ncols);

    var i, j, k, tot, ai;
    var ni = this.nrows;
    var nj = this.ncols;
    var nk = B.ncols;

    var nj1 = nj - 3;

    var Bk = new Float64Array(nj);
    if (global.unrollLoops) {
        for (k = 0; k < nk; ++k) {
            B.copyColumn(k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                ai = this.array[i];
                for (j = 0; j < nj1; j += 4) {
                    tot += ai[j] * Bk[j]
                        + ai[j + 1] * Bk[j + 1]
                        + ai[j + 2] * Bk[j + 2]
                        + ai[j + 3] * Bk[j + 3];
                }
                for (; j < nj; ++j) {
                    tot += ai[j] * Bk[j];
                }
                C.array[i][k] = tot;
            }
        }
    } else {
        for (k = 0; k < nk; ++k) {
            B.copyColumn(k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                ai = this.array[i];
                for (j = 0; j < nj; ++j) {
                    tot += ai * Bk[j];
                }
                C.array[i][k] = tot;
            }
        }
    }
    return C;
};

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

MW.Matrix.prototype.wkTimesElementwise = function(B, tag, rebroadcast) {
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
MW.Matrix.prototype.wkTimesVector = function(v, tag, rebroadcast) {
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
MW.Matrix.prototype.wkTimesMatrix = function(B, tag, rebroadcast) {
    MW.util.checkMatrixMatrix(this, B);
    MW.util.checkNullOrUndefined(tag);

    var i, j, k, tot, ai;
    var ni = this.nrows;
    var nj = this.ncols;
    var lb = MW.util.loadBalance(B.ncols);
    var nk = lb.ito - lb.ifrom;

    var nj1 = nj - 3;

    // transposed
    var C = new Array(nk);
    for (k = 0; k < nk; ++k) {
        C[k] = new Float64Array(ni);
    }

    var Bk = new Float64Array(nj);
    if (global.unrollLoops) {
        for (k = 0; k < nk; ++k) {
            B.copyColumn(lb.ifrom + k, Bk);
            for (i = 0; i < ni; ++i) {
                tot = 0.0;
                ai = this.array[i];
                for (j = 0; j < nj1; j += 4) {
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


