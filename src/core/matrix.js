// Copyright 2014 Adrian W. Lange

/**
 * Matrix class.
 * A wrapper around an array of Float64Arrays (Array.<Float64Array>) with several matrix operations defined,
 * including worker parallelized operations.
 *
 * @param {number} [nrows] the number of rows in the matrix. If not provided or less than 1, a Matrix
 *                         object is still created but with a null array.
 * @param {number} [ncols] the number of columns in the matrix. If not provided or less than 1, a Matrix
 *                         object is still created but with a null array.
 * @constructor
 * @memberof MathWorkers
 */
MathWorkers.Matrix = function(nrows, ncols) {

    /**
     * <p>The underlying Array.&lt;Float64Array&gt; for a Matrix</p>
     *
     * @member {Array.<Float64Array>}
     */
    this.array = [];

    /**
     * The number of rows in this Matrix
     *
     * @member {number}
     */
    this.nrows = nrows || 0;

    /**
     * The number of columns in this Matrix
     *
     * @member {number}
     */
    this.ncols = ncols || 0;

    if (nrows > 0 && ncols > 0) {
        this.array = new Array(nrows);
        for (var r = 0; r < nrows; ++r) {
            this.array[r] = new Float64Array(ncols);
        }
    }
};

/**
 * Create a new Matrix object from a provided 2-dimensional array. Deep copies the array.
 *
 * @param {!Array.<Array.<number>> | !Array.<Float64Array>} arr the 2-dimensional array to be copied
 * @returns {MathWorkers.Matrix} the new Matrix object
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.fromArray = function(arr) {
    MathWorkers.util.checkArray(arr);
    var mat = new MathWorkers.Matrix(arr.length, arr[0].length);
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

/**
 * Assign the underlying Array.<Float64Array> for this Matrix
 *
 * @param {!Array.<Float64Array>} arr the Array.<Float64Array> to be assigned to this Matrix object
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.setMatrix = function(arr) {
    MathWorkers.util.checkArray(arr);
    MathWorkers.util.checkFloat64Array(arr[0]);
    this.array = arr;
    this.nrows = arr.length;
    this.ncols = arr[0].length;
};

/**
 * Copy a provided array into the j-th column of this Matrix
 *
 * @param {!number} j the index of the column to which to copy
 * @param {!Array.<number> | !Float64Array} vec the vector to be copied
 * @memberod MathWorkers.Matrix
 * @ignore
 */
MathWorkers.Matrix.prototype.copyColumn = function(j, vec) {
    for (var i = 0, ni = this.nrows; i < ni; ++i) {
        vec[i] = this.array[i][j];
    }
};

/**
 * Copy a provided array into the i-th row of this Matrix
 *
 * @param {!number} i the index of the row to which to copy
 * @param {!Array.<number> | !Float64Array} vec the vector to be copied
 * @memberof MathWorkers.Matrix
 * @ignore
 */
MathWorkers.Matrix.prototype.copyRow = function(i, vec) {
    for (var j = 0, nj = this.ncols; j < nj; ++j) {
        vec[j] = this.array[i][j];
    }
};

/**
 * Test if this matrix is a square matrix.
 *
 * @returns {boolean} true if this matrix has an equal number row and columns. False otherwise.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.isSquare = function() {
    return this.nrows === this.ncols;
};

/**
 * Create a new Matrix object populated with all zero values.
 *
 * @param {!number} nrows the number of rows for the new Matrix
 * @param {!number} ncols the number of columns for the new Matrix
 * @returns {MathWorkers.Matrix} an nrows by ncols Matrix populated with zeroes
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.zeroes = function(nrows, ncols) {
    var mat = new MathWorkers.Matrix(nrows, ncols);
    for (var i = 0; i < nrows; ++i) {
        for (var j = 0; j < ncols; ++j) {
            mat.array[i][j] = 0.0;
        }
    }
    return mat;
};

/**
 * Create a new Matrix object whose elements are those of an identity matrix.
 *
 * @param {!number} n the number of rows and columns for the identity matrix
 * @returns {MathWorkers.Matrix} the new identity Matrix object
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.identity = function(n) {
    var mat = new MathWorkers.Matrix(n, n);
    for (var i = 0; i < n; ++i) {
        for (var j = 0; j < n; ++j) {
            mat.array[i][j] = 0.0;
        }
        mat.array[i][i] = 1.0;
    }
    return mat;
};

/**
 * Create a new Matrix object populated with random values between 0 and 1.
 *
 * @param {!number} nrows the number of rows for the new Matrix
 * @param {!number} ncols the number of columns for the new Matrix
 * @returns {MathWorkers.Matrix} an nrows by ncols Matrix populated with zeroes
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.randomMatrix = function(nrows, ncols) {
    var mat = new MathWorkers.Matrix(nrows, ncols);
    for (var i = 0; i < nrows; ++i) {
        for (var j = 0; j < ncols; ++j) {
            mat.array[i][j] = Math.random();
        }
    }
    return mat;
};

/**
 * Convert the Matrix data into a printable string
 *
 * @returns {string} the string representation of the Matrix
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.toString = function() {
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

/**
 * Add this Matrix to another (element-wise).
 *
 * @param {!MathWorkers.Matrix} B the Matrix to add to this Matrix
 * @returns {MathWorkers.Matrix} the element-wise sum of the Matrix and B
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.plus = function(B) {
    MathWorkers.util.checkMatrices(this, B);
    var C = new MathWorkers.Matrix(this.nrows, this.ncols);
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

/**
 * Subtract another Matrix from this Matrix (element-wise).
 *
 * @param {!MathWorkers.Matrix} B the Matrix to subtract from this Matrix
 * @returns {MathWorkers.Matrix} the element-wise difference of B from this Matrix
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.minus = function(B) {
    MathWorkers.util.checkMatrices(this, B);
    var C = new MathWorkers.Matrix(this.nrows, this.ncols);
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

/**
 * Multiply this Matrix with another (element-wise).
 *
 * @param {!MathWorkers.Matrix} B the Matrix to multiply with this Matrix
 * @returns {MathWorkers.Matrix} the element-wise product of this Matrix and B
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.times = function(B) {
    MathWorkers.util.checkMatrices(this, B);
    var C = new MathWorkers.Matrix(this.nrows, this.ncols);
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

/**
 * Divide this Matrix by another (element-wise).
 *
 * @param {!MathWorkers.Matrix} B the Matrix to divide this Matrix by
 * @returns {MathWorkers.Matrix} the element-wise quotient of this Matrix by B
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.divide = function(B) {
    MathWorkers.util.checkMatrices(this, B);
    var C = new MathWorkers.Matrix(this.nrows, this.ncols);
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

/**
 * Multiply all elements of this Matrix by a scalar.
 *
 * @param {!number} alpha the scalar to multiply by
 * @returns {MathWorkers.Matrix} the scaled Matrix
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.scale = function(alpha) {
    MathWorkers.util.checkNumber(alpha);
    var C = new MathWorkers.Matrix(this.nrows, this.ncols);
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

/**
 * Apply (or, map) a function onto each value in this Matrix. The function must take a number as its argument and
 * return a number. That is, the function must map a number to a number.
 *
 * @param {!function} fn the function to be applied to each element of the Matrix
 * @returns {MathWorkers.Matrix} the mapped Matrix
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.apply = function(fn) {
    MathWorkers.util.checkFunction(fn);
    var C = new MathWorkers.Matrix(this.nrows, this.ncols);
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

/**
 * Transpose this Matrix. Returns a new Matrix to allow for arbitrary shaped matrices.
 *
 * @returns {MathWorkers.Matrix} a new Matrix that is the transpose of this Matrix
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.transpose = function() {
    var B = new MathWorkers.Matrix(this.ncols, this.nrows);
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

/**
 * Transpose this square matrix in place. Only works for square matrices.
 *
 * @returns {MathWorkers.Matrix} this Matrix transposed
 * @throws {Error} thrown if this Matrix is not a square matrix.
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.transposeInPlace = function() {
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

/**
 * Compute the matrix-vector product of this Matrix with a Vector.
 * It is assumed that this Vector is transposed such that it is a column vector.
 * The ordering is such that this Matrix is A and the Vector is v: A.v
 *
 * @param {!MathWorkers.Vector} v the Vector to be multiplied with
 * @returns {MathWorkers.Vector} the resulting Vector of the Matrix-Vector product
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.dotVector = function(v) {
    MathWorkers.util.checkMatrixVector(this, v);
    var w = new MathWorkers.Vector(this.nrows);
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
                tot += ai[j] * v.array[j] +
                    ai[j+1] * v.array[j+1] +
                    ai[j+2] * v.array[j+2] +
                    ai[j+3] * v.array[j+3];
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

/**
 * Compute the matrix-matrix product of this Matrix with another Matrix. The ordering
 * is such that this Matrix is A and the other matrix is B: A.B
 *
 * @param {!MathWorkers.Matrix} B the Matrix to multiply with this Matrix
 * @returns {MathWorkers.Matrix} the resulting Matrix of the matrix-matrix product
 * @memberof MathWorkers.Matrix
 */
MathWorkers.Matrix.prototype.dotMatrix = function(B) {
    MathWorkers.util.checkMatrixMatrix(this, B);
    var C = new MathWorkers.Matrix(this.nrows, B.ncols);

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
                    tot += ai[j] * Bk[j] +
                        ai[j+1] * Bk[j+1] +
                        ai[j+2] * Bk[j+2] +
                        ai[j+3] * Bk[j+3];
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

