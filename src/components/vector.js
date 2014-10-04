
/**
 *  Vector class
 *
 *  A wrapper around an array
 */
MW.Vector = function(size) {
    var that = this;
    var v = null;
    this.length = size;

    if (size !== undefined && size > 0) {
        v = new Float64Array(size);
    }
};

MW.Vector.prototype.get = function(i) {
    return v[i];
};

MW.Vector.prototype.set = function(i, val) {
    v[i] = val;
};

MW.Vector.prototype.getArray = function() {
    return v;
};

MW.Vector.prototype.setVector = function(w) {
    v = w;
    that.length = w.length;
};

MW.Vector.prototype.toString = function() {
    var str = "[";
    for (var i = 0; i < that.length - 1; ++i) {
        str += v[i] + ", ";
    }
    return str + v[that.length-1] + "]";
};

MW.Vector.prototype.plus = function(w) {
    var result = new MW.Vector(that.length);
    for (var i = 0; i < that.length; ++i) {
        result.set(i, v[i] + w.get(i));
    }
    return result;
};

MW.Vector.prototype.minus = function(w) {
    var result = new MW.Vector(that.length);
    for (var i = 0; i < that.length; ++i) {
        result.set(i, v[i] - w.get(i));
    }
    return result;
};

MW.Vector.prototype.times = function(w) {
    var result = new MW.Vector(that.length);
    for (var i = 0; i < that.length; ++i) {
        result.set(i, v[i] * w.get(i));
    }
    return result;
};

MW.Vector.prototype.dividedBy = function(w) {
    var result = new MW.Vector(that.length);
    for (var i = 0; i < that.length; ++i) {
        result.set(i, v[i] / w.get(i));
    }
    return result;
};

MW.Vector.prototype.scale = function(alpha) {
    var result = new MW.Vector(that.length);
    for (var i = 0; i < that.length; ++i) {
        result.set(i, v[i] * alpha);
    }
    return result;
};

MW.Vector.prototype.apply = function(fn) {
    var result = new MW.Vector(that.length);
    for (var i = 0; i < that.length; ++i) {
        result.set(i, fn(v[i]));
    }
    return result;
};

MW.Vector.prototype.dot = function(w) {
    var tot = 0.0;
    for (var i = 0; i < that.length; ++i) {
        tot += v[i] * w.get(i);
    }
    return tot;
};

MW.Vector.prototype.norm = function() {
    var result = 0.0;
    for (var i = 0.0; i < that.length; ++i) {
        result += v[i] * v[i];
    }
    return Math.sqrt(result);
};

MW.Vector.prototype.sum = function() {
    var result = 0.0;
    for (var i = 0.0; i < that.length; ++i) {
        result += v[i];
    }
    return result;
};

MW.Vector.prototype.wkPlus = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = v[i] + w.get(i);
    }
    MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
};

MW.Vector.prototype.wkMinus = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = v[i] - w.get(i);
    }
    MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
};

MW.Vector.prototype.wkTimes = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = v[i] * w.get(i);
    }
    MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
};

MW.Vector.prototype.wkDividedBy = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = v[i] / w.get(i);
    }
    MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
};

MW.Vector.prototype.wkScale = function(alpha, tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = v[i] * alpha;
    }
    MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
};

MW.Vector.prototype.wkApply = function(fn, tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = fn(v[i]);
    }
    MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
};

MW.Vector.prototype.wkNorm = function(tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += v[i] * v[i];
    }
    MW.MathWorker.reduceVectorNorm(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkDot = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += v[i] * w.get(i);
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkSum = function(tag, rebroadcast) {
    var lb = util.loadBalance(that.length, id);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += v[i];
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

// vector-matrix multiply: v.A
MW.Vector.prototype.timesMatrix = function(A) {
    var w = new MW.Vector(A.ncols);
    for (var i = 0; i < A.ncols; ++i) {
        var tot = 0.0;
        for (var j = 0; j < that.length; ++j) {
            tot += v[j] * A.get(j, i);
        }
        w.set(i, tot);
    }
    return w;
};

// vector-matrix multiply: v.A
MW.Vector.prototype.wkTimesMatrix = function(A, tag, rebroadcast) {
    var lb = util.loadBalance(A.ncols, id);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        var tot = 0.0;
        for (var j = 0; j < that.length; ++j) {
            tot += v[j] * A.get(j, i);
        }
        w[offset++] = tot;
    }
    MW.MathWorker.gatherVector(w, tag, id, rebroadcast);
};

MW.Vector.fromArray = function(arr, mathWorkerId) {
    var vec = new MW.Vector(arr.length, mathWorkerId);
    for (var i = 0; i < arr.length; ++i) {
        vec.set(i, arr[i]);
    }
    return vec;
};

