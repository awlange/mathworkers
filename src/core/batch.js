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
MW.Batch = {};

/**
 * Compute (in parallel) a linear combination of Vectors, each with a coefficient in a corresponding array.
 *
 * @param {!Array.<MW.Vector>} vectors the array of Vectors
 * @param {!Array.<number>} coefficients the array of coefficients
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @function workerVectorLinearCombination
 * @memberof MathWorkers.Batch
 */
MW.Batch.workerVectorLinearCombination = function (vectors, coefficients, tag, rebroadcast) {
    MW.util.checkNumber(coefficients[0]);
    MW.util.checkVector(vectors[0]);
    MW.util.checkNullOrUndefined(tag);

    // First combo initializes x
    var i, a, ni3;
    var offset = 0;
    var vec = vectors[0];
    var coeff = coefficients[0];
    var lb = MW.util.loadBalance(vec.length);
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
        MW.util.checkNumber(coeff);
        MW.util.checkVectors(vectors[a - 1], vec);
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

    MW.MathWorker.gatherVector(x, vec.length, lb.ifrom, tag, rebroadcast);
};

/**
 * Compute (in parallel) a linear combination of matrices, each with a coefficient in a corresponding array.
 *
 * @param {!Array.<MW.Matrix>} matrices the array of Matrix objects
 * @param {!Array.<number>} coefficients the array of coefficients
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @function workerMatrixLinearCombination
 * @memberof MathWorkers.Batch
 */
MW.Batch.workerMatrixLinearCombination = function(matrices, coefficients, tag, rebroadcast) {
    MW.util.checkNumber(coefficients[0]);
    MW.util.checkMatrix(matrices[0]);
    MW.util.checkNullOrUndefined(tag);

    // First combo initializes M
    var M = [];
    var offset = 0;
    var mat = matrices[0];
    var coeff = coefficients[0];
    var lb = MW.util.loadBalance(matrices[0].nrows);
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        M.push(new Float64Array(mat.ncols));
        for (var j = 0; j < mat.ncols; ++j) {
            M[offset][j] = coeff * mat.array[i][j];
        }
        ++offset;
    }

    // Remaining combos
    for (var a = 1; a < matrices.length; ++a) {
        offset = 0;
        mat = matrices[a];
        coeff = coefficients[a];
        MW.util.checkNumber(coeff);
        MW.util.checkMatrices(matrices[a-1], mat);
        for (i = lb.ifrom; i < lb.ito; ++i) {
            for (j = 0; j < mat.ncols; ++j) {
                M[offset][j] += coeff * mat.array[i][j]
            }
            ++offset;
        }
    }

    MW.MathWorker.gatherMatrixRows(M, mat.nrows, lb.ifrom, tag, rebroadcast);
},

/**
 * Compute (in parallel) a matrix-vector product in combination with adding another vector to its result and also
 * multiplying by scalars. Operation is of the form: z = alpha * A.x + beta * y. The parameters beta and y are
 * optional, but both must be provided for them to be included.
 *
 * @param {!number} alpha scalar to multiply the matrix-vector product by
 * @param {!MW.Matrix} A the Matrix in the matrix-vector product
 * @param {!MW.Vector} x the Vector in the matrix-vector product
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @param {number} [beta] optional scalar to multiply Vector y by
 * @param {MW.Vector} [y] optional Vector to be scaled by beta and then added the the matrix-vector product.
 * @function workerMatrixVectorPlus
 * @memberof MathWorkers.Batch
 */
 MW.Batch.workerMatrixVectorPlus = function(alpha, A, x, tag, rebroadcast, beta, y) {
    MW.util.checkNumber(alpha);
    MW.util.checkMatrixVector(A, x);
    MW.util.checkNullOrUndefined(tag);

    var lb = MW.util.loadBalance(A.nrows);
    var z = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    if (beta && y) {
        MW.util.checkNumber(beta);
        MW.util.checkVectors(x, y);
        for (var i = lb.ifrom; i < lb.ito; ++i) {
            var tot = 0.0;
            for (var j = 0; j < this.ncols; ++j) {
                tot += A.array[i][j] * v.array[j];
            }
            z[offset++] = alpha * tot + beta * y[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot = 0.0;
            for (j = 0; j < this.ncols; ++j) {
                tot += A.array[i][j] * v.array[j];
            }
            z[offset++] = alpha * tot;
        }
    }
    MW.MathWorker.gatherVector(z, x.length, lb.ifrom, tag, rebroadcast);
};


/**
 * Compute (in parallel) a matrix-matrix product in combination with adding another matrix to its result and also
 * multiplying by scalars. Operation is of the form: D = alpha * A.B + beta * C. The parameters beta and C are
 * optional, but both must be provided for them to be included.
 *
 * @param {!number} alpha the scalar to multiply the matrix-matrix product by
 * @param {!MW.Matrix} A the left-side Matrix in the matrix-matrix product
 * @param {!MW.Matrix} B the right-side Matrix in the matrix-matrix product
 * @param {!string} tag message tag
 * @param {boolean} [rebroadcast] If true, the coordinator broadcasts the result back to the workers.
 * @param {number} [beta] the scalar to multiply the Matrix C by
 * @param {MW.Matrix} [C] the Matrix to be scaled by beta and then added to the matrix-matrix product
 * @function workerMatrixMatrixPlus
 * @memberof MathWorkers.Batch
 */
 MW.Batch.workerMatrixMatrixPlus = function(alpha, A, B, tag, rebroadcast, beta, C) {
    MW.util.checkNumber(alpha);
    MW.util.checkMatrixMatrix(A, B);
    MW.util.checkNullOrUndefined(tag);

    // Transpose B for better row-major memory access
    // If square, save on memory by doing an in-place transpose
    var Bt = B.isSquare() ? B.transposeInPlace() : B.transpose();
    var lb = MW.util.loadBalance(A.nrows);
    var D = [];
    var offset = 0;

    if (beta && C) {
        MW.util.checkNumber(beta);
        MW.util.checkMatrix(C);
        if (!(A.nrows === C.nrows && B.ncols === C.ncols)) {
            throw new Error("Matrix dimensions not compatible for addition.");
        }

        for (var i = lb.ifrom; i < lb.ito; ++i) {
            D.push(new Float64Array(B.ncols));
            for (var j = 0; j < B.ncols; ++j) {
                var tot = 0.0;
                for (var k = 0; k < A.ncols; ++k) {
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

    MW.MathWorker.gatherMatrixRows(D, A.nrows, lb.ifrom, tag, rebroadcast);
};


