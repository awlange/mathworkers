// Copyright 2014 Adrian W. Lange

/**
 *  Vector class
 *
 *  A wrapper around a Float64Array
 */
MW.Vector = function(size) {
    this.array = null;
    this.length = size || 0;
    if (size > 0) {
        this.array = new Float64Array(size);
    }
};

// Deep copy the array
MW.Vector.fromArray = function(arr) {
    MW.util.checkArray(arr);
    var vec = new MW.Vector(arr.length);
    for (var i = 0; i < arr.length; ++i) {
        vec.array[i] = arr[i];
    }
    return vec;
};

MW.Vector.prototype.setVector = function(arr) {
    MW.util.checkFloat64Array(arr);
    this.array = arr;
    this.length = arr.length;
};

MW.Vector.randomVector = function(size) {
    var vec = new Vector(size);
    for (var i = 0; i < size; ++i) {
        vec.array[i] = Math.random();
    }
    return vec;
};

MW.Vector.prototype.toString = function() {
    var str = "[";
    for (var i = 0; i < this.length - 1; ++i) {
        str += this.array[i] + ", ";
    }
    return str + this.array[this.length-1] + "]";
};

MW.Vector.prototype.plus = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] + w.array[i];
    }
    return result;
};

MW.Vector.prototype.minus = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] - w.array[i];
    }
    return result;
};

MW.Vector.prototype.timesElementwise = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] * w.array[i];
    }
    return result;
};

MW.Vector.prototype.divide = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] / w.array[i];
    }
    return result;
};

MW.Vector.prototype.scale = function(alpha) {
    MW.util.checkNumber(alpha);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] * alpha;
    }
    return result;
};

MW.Vector.prototype.apply = function(fn) {
    MW.util.checkFunction(fn);
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = fn(this.array[i]);
    }
    return result;
};

MW.Vector.prototype.dot = function(w) {
    MW.util.checkVectors(this, w);
    var tot = 0.0;
    for (var i = 0; i < this.length; ++i) {
        tot += this.array[i] * w.array[i];
    }
    return tot;
};

MW.Vector.prototype.norm = function() {
    var result = 0.0;
    for (var i = 0.0; i < this.length; ++i) {
        result += this.array[i] * this.array[i];
    }
    return Math.sqrt(result);
};

MW.Vector.prototype.sum = function() {
    var result = 0.0;
    for (var i = 0.0; i < this.length; ++i) {
        result += this.array[i];
    }
    return result;
};

// vector-matrix multiply: v.A
MW.Vector.prototype.timesMatrix = function(A) {
    MW.util.checkVectorMatrix(this, A);
    var w = new MW.Vector(A.ncols);
    for (var i = 0; i < A.ncols; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.length; ++j) {
            tot += this.array[j] * A.array[j][i];
        }
        w.array[i] = tot;
    }
    return w;
};

MW.Vector.prototype.wkPlus = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] + w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
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
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkTimesElementwise = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
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
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
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
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
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
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkNorm = function(tag, rebroadcast) {
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i] * this.array[i];
    }
    MW.MathWorker.reduceVectorNorm(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkDot = function(w, tag, rebroadcast) {
    MW.util.checkVectors(this, w);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i] * w.array[i];
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
MW.Vector.prototype.wkTimesMatrix = function(A, tag, rebroadcast) {
    MW.util.checkVectorMatrix(this, A);
    MW.util.checkNullOrUndefined(tag);
    var lb = MW.util.loadBalance(A.ncols);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.length; ++j) {
            tot += this.array[j] * A.array[j][i];
        }
        w[offset++] = tot;
    }
    MW.MathWorker.gatherVector(w, tag, rebroadcast);
};


