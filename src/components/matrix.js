// Copyright 2014 Adrian W. Lange

/**
 *  Matrix class
 */
MW.Matrix = function(nrows, ncols) {
    this.array = [];
    this.nrows = nrows || 0;
    this.ncols = ncols || 0;

    if (nrows > 0 && ncols > 0) {
        for (var r = 0; r < nrows; ++r) {
            this.array.push(new Float64Array(ncols));
        }
    }
};

// Deep copy the array
MW.Matrix.fromArray = function(arr) {
    util.checkArray(arr);
    var mat = new MW.Matrix(arr.length, arr[0].length);
    for (var i = 0; i < arr.length; ++i) {
        for (var j = 0; j < arr[i].length; ++j) {
            mat.array[i][j] = arr[i][j];
        }
    }
    return mat;
};

MW.Matrix.prototype.setMatrix = function(arr) {
    util.checkArray(arr);
    util.checkFloat64Array(arr[0]);
    this.array = arr;
    this.nrows = arr.length;
    this.ncols = arr[0].length;
};

MW.Matrix.prototype.isSquare = function() {
    return this.nrows == this.ncols;
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
    checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] + B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.minus = function(B) {
    checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] - B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.times = function(B) {
    checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] * B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.dividedBy = function(B) {
    checkMatrices(this, B);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] / B.array[i][j];
        }
    }
    return C;
};

MW.Matrix.prototype.scale = function(alpha) {
    util.checkNumber(alpha);
    var C = new MW.Matrix(this.nrows, this.ncols);
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < this.ncols; ++j) {
            C.array[i][j] = this.array[i][j] * alpha;
        }
    }
    return C;
};

MW.Matrix.prototype.apply = function(fn) {
    util.checkFunction(fn);
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
    checkMatrixVector(this, v);
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
// TODO: if alpha is specified: alpha * A.B
MW.Matrix.prototype.timesMatrix = function(B) {
    checkMatrixMatrix(this, B);
    var C = new MW.Matrix(this.nrows, B.ncols);
    // Transpose B for better row-major memory access
    var Bt = B.transpose();
    for (var i = 0; i < this.nrows; ++i) {
        for (var j = 0; j < B.ncols; ++j) {
            var tot = 0.0;
            for (var k = 0; k < this.ncols; ++k) {
                tot += this.array[i][k] * Bt.array[j][k];
            }
            C.array[i][j] = tot;
        }
    }
    return C;
};

MW.Matrix.prototype.wkPlus = function(B, tag, rebroadcast) {
    checkMatrices(this, B);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] + B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkMinus = function(B, tag, rebroadcast) {
    checkMatrices(this, B);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] - B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkTimes = function(B, tag, rebroadcast) {
    checkMatrices(this, B);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] * B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkDividedBy = function(B, tag, rebroadcast) {
    checkMatrices(this, B);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = this.array[i][j] / B.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkScale = function(alpha, tag, rebroadcast) {
    util.checkNumber(alpha);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = alpha * this.array[i][j];
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

MW.Matrix.prototype.wkApply = function(fn, tag, rebroadcast) {
    util.checkFunction(fn);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(this.ncols));
        for (var j = 0; j < this.ncols; ++j) {
            C[offset][j] = fn(this.array[i][j]);
        }
        ++offset;
    }
    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};

// matrix-vector multiply: A.v
MW.Matrix.prototype.wkTimesVector = function(v, tag, rebroadcast) {
    checkMatrixVector(this, v);
    util.checkNotNullOrUndefined(tag);
    var lb = util.loadBalance(this.nrows);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.ncols; ++j) {
            tot += this.array[i][j] * v.array[j];
        }
        w[offset++] = tot;
    }
    MW.MathWorker.gatherVector(w, tag, rebroadcast);
};

// C = A.B
MW.Matrix.prototype.wkTimesMatrix = function(B, tag, rebroadcast) {
    checkMatrixMatrix(this, B);
    util.checkNotNullOrUndefined(tag);

    // Transpose B for better row-major memory access
    // If square, save on memory by doing an in-place transpose
    var Bt = B.isSquare() ? B.transposeInPlace() : B.transpose();

    var lb = util.loadBalance(this.nrows);
    var C = [];
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        C.push(new Float64Array(B.ncols));
        for (var j = 0; j < B.ncols; ++j) {
            var tot = 0.0;
            for (var k = 0; k < this.ncols; ++k) {
                tot += this.array[i][k] * Bt.array[j][k];
            }
            C[offset][j] = tot;
        }
        ++offset;
    }

    // restore B
    if (B.isSquare) {
        B.transposeInPlace();
    }

    MW.MathWorker.gatherMatrix(C, lb.ifrom, tag, rebroadcast);
};


/**
 *  Matrix helper functions
 */

/**
 *  Verify that A is a Matrix and is not null or undefined
 */
function checkMatrix(A) {
    util.checkNotNullOrUndefined(A);
    if (!(A instanceof Matrix)) {
        throw new TypeError("Expected type Matrix but is not.");
    }
}

/**
 *  Verify that Matrix A and Matrix B have equal dimensions and are neither null nor undefined
 */
function checkMatrices(A, B) {
    checkMatrix(A);
    checkMatrix(B);
    if (!(A.nrows === B.nrows && A.ncols === B.ncols)) {
        throw new Error("Matrices do not have equal numbers of rows and columns.");
    }
}

/**
 *  Verify that Matrix A and Vector v are compatible for matrix-vector products
 *  and are both not null or undefined
 */
function checkMatrixVector(A, v) {
    checkMatrix(A);
    checkVector(v);
    if (v.length !== A.ncols) {
        throw new Error("Vector length and number Matrix columns are unequal.");
    }
}

/**
 *  Verify that Matrix A and Matrix B have compatible dimensions for matrix-matrix
 *  multiplication and are neither null nor undefined
 */
function checkMatrixMatrix(A, B) {
    checkMatrix(A);
    checkMatrix(B);
    if (A.ncols !== B.nrows) {
        throw new Error("Matrices do not have compatible dimensions for matrix-matrix multiplication.");
    }
}

