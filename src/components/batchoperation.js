// Copyright 2014 Adrian W. Lange

/**
 *  Batch-operation methods
 *
 *  Combine multiple primitive Vector and/or Matrix operations into a single
 *  method call, reducing some overhead, especially with regard to communication.
 */

MW.BatchOperation = {};

MW.BatchOperation.wkMatrixLinearCombination = function(matrices, coefficients, tag, rebroadcast) {
    // TODO: verify that all matrices have same dimensions, same with coefficients
    var lb = MW.util.loadBalance(matrices[0].nrows);

    // First combo initializes M
    var M = [];
    var offset = 0;
    var mat = matrices[0];
    var coeff = coefficients[0];
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
        for (i = lb.ifrom; i < lb.ito; ++i) {
            for (j = 0; j < mat.ncols; ++j) {
                M[offset][j] += coeff * mat.array[i][j]
            }
            ++offset;
        }
    }

    MW.MathWorker.gatherMatrix(M, lb.ifrom, tag, rebroadcast);
};


// D = alpha * A.B + beta * C
MW.BatchOperation.wkScaleMatrixMatrixProductPlus = function(alpha, A, B, tag, rebroadcast, beta, C) {
    // Transpose B for better row-major memory access
    // If square, save on memory by doing an in-place transpose
    var Bt = B.isSquare() ? B.transposeInPlace() : B.transpose();

    var lb = MW.util.loadBalance(A.nrows);
    var D = [];
    var offset = 0;

    if (beta && C) {
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

    MW.MathWorker.gatherMatrix(D, lb.ifrom, tag, rebroadcast);
};

