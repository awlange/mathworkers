
/**
 *  Vector class
 *
 *  A wrapper around an array
 */
MW.Vector = function(size) {
    this.array = null;
    this.length = size;
    if (size !== undefined && size > 0) {
        this.array = new Float64Array(size);
    }
};

MW.Vector.prototype.setVector = function(w) {
    this.array = w;
    this.length = w.length;
};

MW.Vector.prototype.toString = function() {
    var str = "[";
    for (var i = 0; i < this.length - 1; ++i) {
        str += this.array[i] + ", ";
    }
    return str + v[this.length-1] + "]";
};

MW.Vector.prototype.plus = function(w) {
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] + w.array[i];
    }
    return result;
};

MW.Vector.prototype.minus = function(w) {
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] - w.array[i];
    }
    return result;
};

MW.Vector.prototype.times = function(w) {
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] * w.array[i];
    }
    return result;
};

MW.Vector.prototype.dividedBy = function(w) {
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] / w.array[i];
    }
    return result;
};

MW.Vector.prototype.scale = function(alpha) {
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = this.array[i] * alpha;
    }
    return result;
};

MW.Vector.prototype.apply = function(fn) {
    var result = new MW.Vector(this.length);
    for (var i = 0; i < this.length; ++i) {
        result.array[i] = fn(v[i]);
    }
    return result;
};

MW.Vector.prototype.dot = function(w) {
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
    var w = new MW.Vector(A.ncols);
    for (var i = 0; i < A.ncols; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.length; ++j) {
            tot += this.array[j] * A.get(j, i);
        }
        w.array[i] = tot;
    }
    return w;
};

MW.Vector.prototype.wkPlus = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] + w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkMinus = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] - w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkTimes = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkDividedBy = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] / w.array[i];
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkScale = function(alpha, tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = this.array[i] * alpha;
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkApply = function(fn, tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var x = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        x[offset++] = fn(this.array[i]);
    }
    MW.MathWorker.gatherVector(x, tag, rebroadcast);
};

MW.Vector.prototype.wkNorm = function(tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i] * this.array[i];
    }
    MW.MathWorker.reduceVectorNorm(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkDot = function(w, tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i] * w.array[i];
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

MW.Vector.prototype.wkSum = function(tag, rebroadcast) {
    var lb = util.loadBalance(this.length);
    var tot = 0.0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        tot += this.array[i];
    }
    MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
};

// vector-matrix multiply: v.A
MW.Vector.prototype.wkTimesMatrix = function(A, tag, rebroadcast) {
    var lb = util.loadBalance(A.ncols);
    var w = new Float64Array(lb.ito - lb.ifrom);
    var offset = 0;
    for (var i = lb.ifrom; i < lb.ito; ++i) {
        var tot = 0.0;
        for (var j = 0; j < this.length; ++j) {
            tot += this.array[j] * A.get(j, i);
        }
        w[offset++] = tot;
    }
    MW.MathWorker.gatherVector(w, tag, rebroadcast);
};

// Deep copy the array
MW.Vector.fromArray = function(arr) {
    var vec = new MW.Vector(arr.length);
    for (var i = 0; i < arr.length; ++i) {
        vec.array[i] = arr[i];
    }
    return vec;
};

