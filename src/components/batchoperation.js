// Copyright 2014 Adrian W. Lange

/**
 *  Batch-operation methods
 *
 *  Combine multiple primitive Vector and/or Matrix operations into a single
 *  method call, reducing some overhead, especially with regard to communication.
 */

MW.BatchOperation = {};

MW.BatchOperation.wkVectorLinearCombination = function(vectors, coefficients, tag, rebroadcast) {
    MW.util.checkNumber(coefficients[0]);
    MW.util.checkVector(vectors[0]);

    // First combo initializes x
    var offset = 0;
    var vec = vectors[0];
    var coeff = coefficients[0];
    var lb = MW.util.loadBalance(vec.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = coeff * vec.array[i];
    }

    // Remaining combos
    for (var a = 1; a < vectors.length; ++a) {
        offset = 0;
        vec = vectors[a];
        coeff = coefficients[a];
        MW.util.checkNumber(coeff);
        MW.util.checkVectors(vectors[a-1], vec);
        for (i = lb.ifrom; i < lb.ito; ++i) {
            x[offset++] += coeff * vec.array[i];
        }
    }

    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.BatchOperation.wkMatrixLinearCombination = function(matrices, coefficients, tag, rebroadcast) {
    MW.util.checkNumber(coefficients[0]);
    MW.util.checkMatrix(matrices[0]);

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

    MW.MathWorker.gatherMatrix(M, lb.ifrom, tag, rebroadcast);
};


// D = alpha * A.B + beta * C
MW.BatchOperation.wkMatrixMatrixPlus = function(alpha, A, B, tag, rebroadcast, beta, C) {
    MW.util.checkNumber(alpha);
    MW.util.checkMatrixMatrix(A, B);

    // Transpose B for better row-major memory access
    // If square, save on memory by doing an in-place transpose
    var Bt = B.isSquare() ? B.transposeInPlace() : B.transpose();
    var lb = MW.util.loadBalance(A.nrows);
    var D = [];
    var offset = 0;

    if (beta && C) {
        MW.util.checkNumber(beta);
        MW.util.checkMatrix(C);  // not really checking dimensions here, but will do for now

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

