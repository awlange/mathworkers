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
    var lb = util.loadBalance(matrices[0].nrows);

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