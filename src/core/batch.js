// Copyright 2014 Adrian W. Lange

// TODO: Finish unrolling these guys

/**
 * Batch operation methods.
 *
 * Combine multiple primitive Vector and/or Matrix operations into a single
 * method call, reducing some overhead, especially with regard to communication.
 *
 * @namespace MathWorkers.Batch
 */
MathWorkers.Batch = {};

/**
 * <p>Compute (in parallel) a linear combination of Vectors, each with a coefficient in a corresponding array:</p>
 * <p>w = c<sub>0</sub> * v<sub>0</sub> + c<sub>1</sub> * v<sub>1</sub> + ...</p>
 *
 * @param {!Array.<MathWorkers.Vector>} vectors the array of Vectors
 * @param {!Array.<number>} coefficients the array of coefficients
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @function workerVectorLinearCombination
 * @memberof MathWorkers.Batch
 */
MathWorkers.Batch.workerVectorLinearCombination = function (vectors, coefficients, tag, rebroadcast) {
    MathWorkers.util.checkNumber(coefficients[0]);
    MathWorkers.util.checkVector(vectors[0]);
    MathWorkers.util.checkNullOrUndefined(tag);

    // First combo initializes x
    var i, a, ni3;
    var offset = 0;
    var vec = vectors[0];
    var coeff = coefficients[0];
    var lb = MathWorkers.util.loadBalance(vec.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    if (global.unrollLoops) {
        ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; ++i) {
            x[offset++] = coeff * vec.array[i];
            x[offset++] = coeff * vec.array[i + 1];
            x[offset++] = coeff * vec.array[i + 2];
            x[offset++] = coeff * vec.array[i + 3];
        }
        for (; i < lb.ito; ++i) {
            x[offset++] = coeff * vec.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] = coeff * vec.array[i];
        }
    }

    // Remaining combos
    for (a = 1; a < vectors.length; ++a) {
        offset = 0;
        vec = vectors[a];
        coeff = coefficients[a];
        MathWorkers.util.checkNumber(coeff);
        MathWorkers.util.checkVectors(vectors[a - 1], vec);
        if (global.unrollLoops) {
            for (i = lb.ifrom; i < ni3; ++i) {
                x[offset++] += coeff * vec.array[i];
                x[offset++] += coeff * vec.array[i + 1];
                x[offset++] += coeff * vec.array[i + 2];
                x[offset++] += coeff * vec.array[i + 3];
            }
            for (; i < lb.ito; ++i) {
                x[offset++] += coeff * vec.array[i];
            }
        } else {
            for (i = lb.ifrom; i < lb.ito; ++i) {
                x[offset++] += coeff * vec.array[i];
            }
        }
    }

    MathWorkers.MathWorker.gatherVector(x, vec.length, lb.ifrom, tag, rebroadcast);
};

/**
 * <p>Compute (in parallel) a linear combination of matrices, each with a coefficient in a corresponding array:</p>
 * <p>B = c<sub>0</sub> * A<sub>0</sub> + c<sub>1</sub> * A<sub>1</sub> + ...</p>
 *
 * @param {!Array.<MathWorkers.Matrix>} matrices the array of Matrix objects
 * @param {!Array.<number>} coefficients the array of coefficients
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @function workerMatrixLinearCombination
 * @memberof MathWorkers.Batch
 */
MathWorkers.Batch.workerMatrixLinearCombination = function(matrices, coefficients, tag, rebroadcast) {
    MathWorkers.util.checkNumber(coefficients[0]);
    MathWorkers.util.checkMatrix(matrices[0]);
    MathWorkers.util.checkNullOrUndefined(tag);

    // First combo initializes M
    var i, j;
    var M = [];
    var offset = 0;
    var mat = matrices[0];
    var coeff = coefficients[0];
    var lb = MathWorkers.util.loadBalance(matrices[0].nrows);
    for (i = lb.ifrom; i < lb.ito; ++i) {
        M.push(new Float64Array(mat.ncols));
        for (j = 0; j < mat.ncols; ++j) {
            M[offset][j] = coeff * mat.array[i][j];
        }
        ++offset;
    }

    // Remaining combos
    for (var a = 1; a < matrices.length; ++a) {
        offset = 0;
        mat = matrices[a];
        coeff = coefficients[a];
        MathWorkers.util.checkNumber(coeff);
        MathWorkers.util.checkMatrices(matrices[a-1], mat);
        for (i = lb.ifrom; i < lb.ito; ++i) {
            for (j = 0; j < mat.ncols; ++j) {
                M[offset][j] += coeff * mat.array[i][j];
            }
            ++offset;
        }
    }

    MathWorkers.MathWorker.gatherMatrixRows(M, mat.nrows, lb.ifrom, tag, rebroadcast);
};

/**
 * <p>Compute (in parallel) a matrix-vector product in combination with adding another vector to its result and also
 * multiplying by scalars. Operation is of the form:</p>
 * <p> z = alpha * A.x + beta * y</p>
 * <p>The parameters beta and y are optional, but both must be provided for them to be included.</p>
 *
 * @param {!number} alpha scalar to multiply the matrix-vector product by
 * @param {!MathWorkers.Matrix} A the Matrix in the matrix-vector product
 * @param {!MathWorkers.Vector} x the Vector in the matrix-vector product
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @param {number} [beta] optional scalar to multiply Vector y by
 * @param {MathWorkers.Vector} [y] optional Vector to be scaled by beta and then added the the matrix-vector product.
 * @function workerMatrixVectorPlus
 * @memberof MathWorkers.Batch
 */
 MathWorkers.Batch.workerMatrixVectorPlus = function(alpha, A, x, tag, rebroadcast, beta, y) {
    MathWorkers.util.checkNumber(alpha);
    MathWorkers.util.checkMatrixVector(A, x);
    MathWorkers.util.checkNullOrUndefined(tag);

    var i, j, tot;
    var lb = MathWorkers.util.loadBalance(A.nrows);
    var z = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    if (beta && y) {
        MathWorkers.util.checkNumber(beta);
        MathWorkers.util.checkVectors(x, y);
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot = 0.0;
            for (j = 0; j < this.ncols; ++j) {
                tot += A.array[i][j] * x.array[j];
            }
            z[offset++] = alpha * tot + beta * y[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot = 0.0;
            for (j = 0; j < this.ncols; ++j) {
                tot += A.array[i][j] * x.array[j];
            }
            z[offset++] = alpha * tot;
        }
    }
    MathWorkers.MathWorker.gatherVector(z, x.length, lb.ifrom, tag, rebroadcast);
};


/**
 * <p>Compute (in parallel) a matrix-matrix product in combination with adding another matrix to its result and also
 * multiplying by scalars. Operation is of the form:</p>
 * <p>D = alpha * A.B + beta * C</p>
 * <p>The parameters beta and C are optional, but both must be provided for them to be included.</p>
 *
 * @param {!number} alpha the scalar to multiply the matrix-matrix product by
 * @param {!MathWorkers.Matrix} A the left-side Matrix in the matrix-matrix product
 * @param {!MathWorkers.Matrix} B the right-side Matrix in the matrix-matrix product
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @param {number} [beta] the scalar to multiply the Matrix C by
 * @param {MathWorkers.Matrix} [C] the Matrix to be scaled by beta and then added to the matrix-matrix product
 * @function workerMatrixMatrixPlus
 * @memberof MathWorkers.Batch
 */
 MathWorkers.Batch.workerMatrixMatrixPlus = function(alpha, A, B, tag, rebroadcast, beta, C) {
    MathWorkers.util.checkNumber(alpha);
    MathWorkers.util.checkMatrixMatrix(A, B);
    MathWorkers.util.checkNullOrUndefined(tag);

    // Transpose B for better row-major memory access
    // If square, save on memory by doing an in-place transpose
    var Bt = B.isSquare() ? B.transposeInPlace() : B.transpose();
    var lb = MathWorkers.util.loadBalance(A.nrows);
    var D = [];
    var offset = 0;
    var i, j, k, tot;

    if (beta && C) {
        MathWorkers.util.checkNumber(beta);
        MathWorkers.util.checkMatrix(C);
        if (!(A.nrows === C.nrows && B.ncols === C.ncols)) {
            throw new Error("Matrix dimensions not compatible for addition.");
        }

        for (i = lb.ifrom; i < lb.ito; ++i) {
            D.push(new Float64Array(B.ncols));
            for (j = 0; j < B.ncols; ++j) {
                tot = 0.0;
                for (k = 0; k < A.ncols; ++k) {
                    tot += A.array[i][k] * Bt.array[j][k];
                }
                D[offset][j] = alpha * tot + beta * C.array[i][j];
            }
            ++offset;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            D.push(new Float64Array(B.ncols));
            for (j = 0; j < B.ncols; ++j) {
                tot = 0.0;
                for (k = 0; k < A.ncols; ++k) {
                    tot += A.array[i][k] * Bt.array[j][k];
                }
                D[offset][j] = alpha * tot;
            }
            ++offset;
        }
    }

    // restore B
    if (B.isSquare) {
        B.transposeInPlace();
    }

    MathWorkers.MathWorker.gatherMatrixRows(D, A.nrows, lb.ifrom, tag, rebroadcast);
};


