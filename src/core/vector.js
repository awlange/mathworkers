// Copyright 2014 Adrian W. Lange

/**
 *  Vector class.
 *  A wrapper around a Float64Array with several vector operations defined.
 *
 *  @class
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
    for (var i = 0, ni = arr.length; i < ni; ++i) {
        vec.array[i] = arr[i];
    }
    return vec;
};

MW.Vector.prototype.setVector = function(arr) {
    MW.util.checkFloat64Array(arr);
    this.array = arr;
    this.length = arr.length;
};

MW.Vector.zeroes = function(size) {
    var vec = new Vector(size);
    for (var i = 0; i < size; ++i) {
        vec.array[i] = 0.0;
    }
    return vec;
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

MW.Vector.prototype.sum = function() {
    var result = 0.0;
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result += this.array[i] + this.array[i+1] + this.array[i+2] + this.array[i+3];
        }
        for (; i < ni; ++i) {
            result += this.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result += this.array[i];
        }
    }
    return result;
};

MW.Vector.prototype.product = function() {
    var result = 1.0;
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result *= this.array[i] * this.array[i+1] * this.array[i+2] * this.array[i+3];
        }
        for (; i < ni; ++i) {
            result *= this.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result *= this.array[i];
        }
    }
    return result;
};

MW.Vector.prototype.plus = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] + w.array[i];
            result.array[i+1] = this.array[i+1] + w.array[i+1];
            result.array[i+2] = this.array[i+2] + w.array[i+2];
            result.array[i+3] = this.array[i+3] + w.array[i+3];
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] + w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] + w.array[i];
        }
    }
    return result;
};

MW.Vector.prototype.minus = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] - w.array[i];
            result.array[i+1] = this.array[i+1] - w.array[i+1];
            result.array[i+2] = this.array[i+2] - w.array[i+2];
            result.array[i+3] = this.array[i+3] - w.array[i+3];
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] - w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] - w.array[i];
        }
    }
    return result;
};

MW.Vector.prototype.times = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] * w.array[i];
            result.array[i+1] = this.array[i+1] * w.array[i+1];
            result.array[i+2] = this.array[i+2] * w.array[i+2];
            result.array[i+3] = this.array[i+3] * w.array[i+3];
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] * w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] * w.array[i];
        }
    }
    return result;
};

MW.Vector.prototype.divide = function(w) {
    MW.util.checkVectors(this, w);
    var result = new MW.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] / w.array[i];
            result.array[i+1] = this.array[i+1] / w.array[i+1];
            result.array[i+2] = this.array[i+2] / w.array[i+2];
            result.array[i+3] = this.array[i+3] / w.array[i+3];
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] / w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] / w.array[i];
        }
    }
    return result;
};

MW.Vector.prototype.scale = function(alpha) {
    MW.util.checkNumber(alpha);
    var result = new MW.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = this.array[i] * alpha;
            result.array[i+1] = this.array[i+1] * alpha;
            result.array[i+2] = this.array[i+2] * alpha;
            result.array[i+3] = this.array[i+3] * alpha;
        }
        for (; i < ni; ++i) {
            result.array[i] = this.array[i] * alpha;
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = this.array[i] * alpha;
        }
    }
    return result;
};

MW.Vector.prototype.apply = function(fn) {
    MW.util.checkFunction(fn);
    var result = new MW.Vector(this.length);
    var i;
    var ni = this.length;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            result.array[i] = fn(this.array[i]);
            result.array[i+1] = fn(this.array[i+1]);
            result.array[i+2] = fn(this.array[i+2]);
            result.array[i+3] = fn(this.array[i+3]);
        }
        for (; i < ni; ++i) {
            result.array[i] = fn(this.array[i]);
        }
    } else {
        for (i = 0; i < ni; ++i) {
            result.array[i] = fn(this.array[i]);
        }
    }
    return result;
};

MW.Vector.prototype.dotVector = function(w) {
    MW.util.checkVectors(this, w);
    var i;
    var ni = this.length;
    var tot = 0.0;
    if (global.unrollLoops) {
        var ni3 = ni - 3;
        for (i = 0; i < ni3; i += 4) {
            tot += this.array[i] * w.array[i]
                + this.array[i+1] * w.array[i+1]
                + this.array[i+2] * w.array[i+2]
                + this.array[i+3] * w.array[i+3];
        }
        for (; i < ni; ++i) {
            tot += this.array[i] * w.array[i];
        }
    } else {
        for (i = 0; i < ni; ++i) {
            tot += this.array[i] * w.array[i];
        }
    }
    return tot;
};

// vector-matrix multiply: v.A
MW.Vector.prototype.dotMatrix = function(A) {
    MW.util.checkVectorMatrix(this, A);
    var i, j, tot;
    var ni = A.ncols;
    var nj = this.length;
    var w = new MW.Vector(ni);
    if (global.unrollLoops) {
        var nj3 = nj - 3;
        for (i = 0; i < ni; ++i) {
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
            w.array[i] = tot;
        }
    } else {
        for (i = 0; i < ni; ++i) {
            tot = 0.0;
            for (j = 0; j < nj; ++j) {
                tot += this.array[j] * A.array[j][i];
            }
            w.array[i] = tot;
        }
    }
    return w;
};


