// Copyright 2014 Adrian W. Lange

/**
 *  Batch-operation methods
 *
 *  Combine multiple primitive Vector and/or Matrix operations into a single
 *  method call, reducing some overhead, especially with regard to communication.
 */

// TODO: Finish unrolling these guys

MW.BatchOperation = {};

MW.BatchOperation.wkVectorLinearCombination = function(vectors, coefficients, tag, rebroadcast) {
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
            x[offset++] = coeff * vec.array[i+1];
            x[offset++] = coeff * vec.array[i+2];
            x[offset++] = coeff * vec.array[i+3];
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
        MW.util.checkVectors(vectors[a-1], vec);
        if (global.unrollLoops) {
            for (i = lb.ifrom; i < ni3; ++i) {
                x[offset++] += coeff * vec.array[i];
                x[offset++] += coeff * vec.array[i+1];
                x[offset++] += coeff * vec.array[i+2];
                x[offset++] += coeff * vec.array[i+3];
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

MW.BatchOperation.wkMatrixLinearCombination = function(matrices, coefficients, tag, rebroadcast) {
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
};

// z <- alpha * A.x + beta * y
MW.BatchOperation.wkMatrixVectorPlus = function(alpha, A, x, tag, rebroadcast, beta, y) {
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


// D = alpha * A.B + beta * C
MW.BatchOperation.wkMatrixMatrixPlus = function(alpha, A, B, tag, rebroadcast, beta, C) {
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

