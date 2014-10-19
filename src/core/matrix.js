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
    var i, j, nj;
    var ni = arr.length;
    for (i = 0; i < ni; ++i) {
        nj = arr[i].length;
        for (j = 0; j < nj; ++j) {
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
    var i, j, ai, bi;
    var ni = this.nrows;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            bi = B.array[i];
            for (j = 0; j < nj3; j += 4) {
                C.array[i][j] = ai[j] + bi[j];
                C.array[i][j+1] = ai[j+1] + bi[j+1];
                C.array[i][j+2] = ai[j+2] + bi[j+2];
                C.array[i][j+3] = ai[j+3] + bi[j+3];
            }
            for (; j < nj; ++j) {
                C.array[i][j] = ai[j] + bi[j];
            }
        }
    } else {
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            bi = B.array[i];
            for (j = 0; j < nj; ++j) {
                C.array[i][j] = ai[j] + bi[j];
            }
        }
    }
    return C;
};

MW.Matrix.prototype.minus = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    var i, j, ai, bi;
    var ni = this.nrows;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            bi = B.array[i];
            for (j = 0; j < nj3; j += 4) {
                C.array[i][j] = ai[j] - bi[j];
                C.array[i][j+1] = ai[j+1] - bi[j+1];
                C.array[i][j+2] = ai[j+2] - bi[j+2];
                C.array[i][j+3] = ai[j+3] - bi[j+3];
            }
            for (; j < nj; ++j) {
                C.array[i][j] = ai[j] - bi[j];
            }
        }
    } else {
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            bi = B.array[i];
            for (j = 0; j < nj; ++j) {
                C.array[i][j] = ai[j] - bi[j];
            }
        }
    }
    return C;
};

MW.Matrix.prototype.times = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    var i, j, ai, bi;
    var ni = this.nrows;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            bi = B.array[i];
            for (j = 0; j < nj3; j += 4) {
                C.array[i][j] = ai[j] * bi[j];
                C.array[i][j+1] = ai[j+1] * bi[j+1];
                C.array[i][j+2] = ai[j+2] * bi[j+2];
                C.array[i][j+3] = ai[j+3] * bi[j+3];
            }
            for (; j < nj; ++j) {
                C.array[i][j] = ai[j] * bi[j];
            }
        }
    } else {
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            bi = B.array[i];
            for (j = 0; j < nj; ++j) {
                C.array[i][j] = ai[j] * bi[j];
            }
        }
    }
    return C;
};

MW.Matrix.prototype.divide = function(B) {
    MW.util.checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    var i, j, ai, bi;
    var ni = this.nrows;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            bi = B.array[i];
            for (j = 0; j < nj3; j += 4) {
                C.array[i][j] = ai[j] / bi[j];
                C.array[i][j+1] = ai[j+1] / bi[j+1];
                C.array[i][j+2] = ai[j+2] / bi[j+2];
                C.array[i][j+3] = ai[j+3] / bi[j+3];
            }
            for (; j < nj; ++j) {
                C.array[i][j] = ai[j] / bi[j];
            }
        }
    } else {
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            bi = B.array[i];
            for (j = 0; j < nj; ++j) {
                C.array[i][j] = ai[j] / bi[j];
            }
        }
    }
    return C;
};

MW.Matrix.prototype.scale = function(alpha) {
    MW.util.checkNumber(alpha);
    var C = new MW.Matrix(this.nrows, this.ncols);
    var i, j, ai;
    var ni = this.nrows;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            for (j = 0; j < nj3; j += 4) {
                C.array[i][j] = ai[j] * alpha;
                C.array[i][j+1] = ai[j+1] * alpha;
                C.array[i][j+2] = ai[j+2] * alpha;
                C.array[i][j+3] = ai[j+3] * alpha;
            }
            for (; j < nj; ++j) {
                C.array[i][j] = ai[j] * alpha;
            }
        }
    } else {
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            for (j = 0; j < nj; ++j) {
                C.array[i][j] = ai[j] * alpha;
            }
        }
    }
    return C;
};

MW.Matrix.prototype.apply = function(fn) {
    MW.util.checkFunction(fn);
    var C = new MW.Matrix(this.nrows, this.ncols);
    var i, j, ai;
    var ni = this.nrows;
    var nj = this.ncols;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            for (j = 0; j < nj3; j += 4) {
                C.array[i][j] = fn(ai[j]);
                C.array[i][j+1] = fn(ai[j+1]);
                C.array[i][j+2] = fn(ai[j+2]);
                C.array[i][j+3] = fn(ai[j+3]);
            }
            for (; j < nj; ++j) {
                C.array[i][j] = fn(ai[j]);
            }
        }
    } else {
        for (i = 0; i < ni; ++i) {
            ai = this.array[i];
            for (j = 0; j < nj; ++j) {
                C.array[i][j] = fn(ai[j]);
            }
        }
    }
    return C;
};

// Allocate new matrix and return to allow for arbitrary shaped matrices
MW.Matrix.prototype.transpose = function() {
    var B = new MW.Matrix(this.ncols, this.nrows);
    var i, j, ai;
    var ni = this.nrows;
    var nj = this.ncols;
    for (i = 0; i < ni; ++i) {
        ai = this.array[i];
        for (j = 0; j < nj; ++j) {
            B.array[j][i] = ai[j];
        }
    }
    return B;
};

// Only works for square matrices
MW.Matrix.prototype.transposeInPlace = function() {
    if (this.isSquare()) {
        var i, j;
        var ni = this.nrows;
        var nj = this.ncols;
        for (i = 0; i < ni; ++i) {
            for (j = i + 1; j < nj; ++j) {
                var tmp = this.array[i][j];
                this.array[i][j] = this.array[j][i];
                this.array[j][i] = tmp;
            }
        }
    } else {
        throw new Error("In place transpose only available for square matrices.");
    }
    return this;
};

// matrix-vector multiply: A.v
MW.Matrix.prototype.dotVector = function(v) {
    MW.util.checkMatrixVector(this, v);
    var w = new MW.Vector(this.nrows);
    var tot;
    var i, j;
    var ni = this.nrows;
    var nj = this.ncols;
    var ai;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
            tot = 0.0;
            ai = this.array[i];
            for (j = 0; j < nj3; j += 4) {
                tot += ai[j] * v.array[j]
                    + ai[j+1] * v.array[j+1]
                    + ai[j+2] * v.array[j+2]
                    + ai[j+3] * v.array[j+3];
            }
            for (; j < nj; ++j) {
                tot += ai[j] * v.array[j];
            }
            w.array[i] = tot;
        }
    } else {
        for (i = 0; i < ni; ++i) {
            tot = 0.0;
            ai = this.array[i];
            for (j = 0; j < nj; ++j) {
                tot += ai[j] * v.array[j];
            }
            w.array[i] = tot;
        }
    }
    return w;
};

// matrix-matrix multiply: A.B
MW.Matrix.prototype.dotMatrix = function(B) {
    MW.util.checkMatrixMatrix(this, B);
    var C = new MW.Matrix(this.nrows, B.ncols);

    var i, j, k, tot, ai;
    var ni = this.nrows;
    var nj = this.ncols;
    var nk = B.ncols;

    var Bk = new Float64Array(nj);
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (k = 0; k < nk; ++k) {
            B.copyColumn(k, Bk);
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
                    tot += ai[j] * Bk[j];
                }
                C.array[i][k] = tot;
            }
        }
    }
    return C;
};

