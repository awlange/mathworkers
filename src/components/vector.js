
/**
 *  Vector class
 */
MW.Vector = function(size, mathWorkerId, nWorkersInput) {
	var that = this;
	var id = mathWorkerId || 0;
	var nWorkers = nWorkersInput || 1;
	var v = null;
	this.length = size;

	if (size !== undefined && size > 0) {
		v = new Float64Array(size);
	}

	this.get = function(i) {
		return v[i];
	};

	this.set = function(i, val) {
		v[i] = val;
	};

	this.getArray = function() {
		return v;
	};

	this.setVector = function(w) {
		v = w;
		that.length = w.length;
	};

	this.toString = function() {
		var str = "[";
		for (var i = 0; i < that.length - 1; ++i) {
			str += v[i] + ", ";
		}
		return str + v[that.length-1] + "]";
	};

	this.sendToCoordinator = function(tag) {
		// only id 0 does the sending actually
		if (id == 0) {
			self.postMessage({handle: "_vectorSendToCoordinator", tag: tag,
				vectorBuffer: v.buffer}, [v.buffer]);
		}
	};

	this.plus = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] + w.get(i));
		}
		return result;
	};

	this.minus = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] - w.get(i));
		}
		return result;
	};

	this.times = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] * w.get(i));
		}
		return result;
	};

	this.dividedBy = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] / w.get(i));
		}
		return result;
	};

	this.scale = function(alpha) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] * alpha);
		}
		return result;		
	};

	this.apply = function(fn) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, fn(v[i]));
		}
		return result;		
	};

	this.dot = function(w) {
		var tot = 0.0;
		for (var i = 0; i < that.length; ++i) {
			tot += v[i] * w.get(i);
		}
		return tot;
	};

	this.norm = function() {
		var result = 0.0;
		for (var i = 0.0; i < that.length; ++i) {
			result += v[i] * v[i];
		}
		return Math.sqrt(result);
	};

	this.sum = function() {
		var result = 0.0;
		for (var i = 0.0; i < that.length; ++i) {
			result += v[i];
		}
		return result;
	};

	this.wkPlus = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] + w.get(i);
		}
		MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
	};

	this.wkMinus = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] - w.get(i);
		}
        MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
	};

	this.wkTimes = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] * w.get(i);
		}
        MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
	};

	this.wkDividedBy = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] / w.get(i);
		}
        MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
	};

	this.wkScale = function(alpha, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] * alpha;
		}
        MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
	};

	this.wkApply = function(fn, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = fn(v[i]);
		}
        MW.MathWorker.gatherVector(x, tag, id, rebroadcast);
	};

	this.wkNorm = function(tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * v[i];
		}
        MW.MathWorker.reduceVectorNorm(tot, tag, rebroadcast);
	};

	this.wkDot = function(w, tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * w.get(i);
		}
        MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
	};

	this.wkSum = function(tag, rebroadcast) {
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i];
		}
        MW.MathWorker.reduceVectorSum(tot, tag, rebroadcast);
	};

	// vector-matrix multiply: v.A
	this.timesMatrix = function(A) {
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
	this.wkTimesMatrix = function(A, tag, rebroadcast) {
		var lb = util.loadBalance(A.ncols, nWorkers, id);
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
};

MW.Vector.fromArray = function(arr, mathWorkerId, nWorkersInput) {
	var vec = new MW.Vector(arr.length, mathWorkerId, nWorkersInput);
	for (var i = 0; i < arr.length; ++i) {
		vec.set(i, arr[i]);
	}
	return vec;
};

