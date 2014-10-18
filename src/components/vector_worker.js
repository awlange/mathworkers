// Copyright 2014 Adrian W. Lange

/**
 * Worker versions of the Vector methods
 */

MW.Vector.prototype.wkPlus = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] + w.array[i];
    }
    MW.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

MW.Vector.prototype.wkMinus = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] - w.array[i];
    }
    MW.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

MW.Vector.prototype.wkTimes = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * w.array[i];
    }
    MW.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

MW.Vector.prototype.wkDivide = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] / w.array[i];
    }
    MW.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

MW.Vector.prototype.wkScale = function(alpha, tag, rebroadcast) {
    MW.util.checkNumber(alpha);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * alpha;
    }
    MW.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

MW.Vector.prototype.wkApply = function(fn, tag, rebroadcast) {
    MW.util.checkFunction(fn);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = fn(this.array[i]);
    }
    MW.MathWorker.gatherVector(x, this.length, lb.ifrom, tag, rebroadcast);
};

MW.Vector.prototype.wkDotVector = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var i;
    var tot = 0.0;
    if (global.unrollLoops) {
        var ni3 = lb.ito - 3;
        for (i = lb.ifrom; i < ni3; i += 4) {
            tot += this.array[i] * w.array[i]
                + this.array[i+1] * w.array[i+1]
                + this.array[i+2] * w.array[i+2]
                + this.array[i+3] * w.array[i+3];
        }
        for (; i < lb.ito; ++i) {
            tot += this.array[i] * w.array[i];
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot += this.array[i] * w.array[i];
        }
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkSum = function(tag, rebroadcast) {
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i];
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

// vector-matrix multiply: v.A
MW.Vector.prototype.wkDotMatrix = function(A, tag, rebroadcast) {
    MW.util.checkVectorMatrix(this, A);
    MW.util.checkNullOrUndefined(tag);
    var i, j;
    var nj = this.length;
    var lb = MW.util.loadBalance(A.ncols);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = lb.ifrom; i < lb.ito; ++i) {
            tot = 0.0;
            for (j = 0; j < nj3; j += 4) {
                tot += this.array[j] * A.array[j][i]
                    + this.array[j+1] * A.array[j+1][i]
                    + this.array[j+2] * A.array[j+2][i]
                    + this.array[j+3] * A.array[j+3][i];
            }
            for (; j < nj; ++j) {
                tot += this.array[j] * A.array[j][i];
            }
            w[offset++] = tot;
        }
    } else {
        for (i = lb.ifrom; i < lb.ito; ++i) {
            var tot = 0.0;
            for (j = 0; j < nj; ++j) {
                tot += this.array[j] * A.array[j][i];
            }
            w[offset++] = tot;
        }
    }
    MW.MathWorker.gatherVector(w, this.length, lb.ifrom, tag, rebroadcast);
};