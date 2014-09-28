
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
	}

	this.set = function(i, val) {
		v[i] = val;
	}

	this.getArray = function() {
		return v;
	}

	this.setVector = function(w) {
		v = w;
		that.length = w.length;
	}

	this.toString = function() {
		var str = "[";
		for (var i = 0; i < that.length - 1; ++i) {
			str += v[i] + ", "
		}
		return str + v[that.length-1] + "]";
	}

	this.sendToCoordinator = function(tag) {
		// only id 0 does the sending actually
		if (id == 0) {
			var time = util.getTime();
			self.postMessage({handle: "vectorSendToCoordinator", tag: tag, time: time,
				vectorBuffer: v.buffer}, [v.buffer]);
		}
	}

	this.plus = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] + w.get(i));
		}
		return result;
	}

	this.minus = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] - w.get(i));
		}
		return result;
	}

	this.times = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] * w.get(i));
		}
		return result;
	}

	this.dividedBy = function(w) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] / w.get(i));
		}
		return result;
	}

	this.scale = function(alpha) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, v[i] * alpha);
		}
		return result;		
	}

	this.apply = function(fn) {
		var result = new MW.Vector(that.length);
		for (var i = 0; i < that.length; ++i) {
			result.set(i, fn(v[i]));
		}
		return result;		
	}

	this.dot = function(w) {
		var tot = 0.0;
		for (var i = 0; i < that.length; ++i) {
			tot += v[i] * w.get(i);
		}
		return tot;
	}

	this.norm = function() {
		var result = 0.0;
		for (var i = 0.0; i < that.length; ++i) {
			result += v[i] * v[i];
		}
		return Math.sqrt(result);
	}

	this.sum = function() {
		var result = 0.0;
		for (var i = 0.0; i < that.length; ++i) {
			result += v[i];
		}
		return result;
	}

	this.wkPlus = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] + w.get(i);
		}
		self.postMessage({handle: "vectorParts", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkMinus = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] - w.get(i);
		}
		self.postMessage({handle: "vectorParts", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkTimes = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] * w.get(i);
		}
		self.postMessage({handle: "vectorParts", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkDividedBy = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] / w.get(i);
		}
		self.postMessage({handle: "vectorParts", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkScale = function(alpha, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = v[i] * alpha;
		}
		self.postMessage({handle: "vectorParts", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkApply = function(fn, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var x = new Float64Array(lb.ito - lb.ifrom);
		var offset = 0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			x[offset++] = fn(v[i]);
		}
		self.postMessage({handle: "vectorParts", tag: tag, id: id, time: time, 
			len: x.length, vectorPart: x.buffer}, [x.buffer]);
	}

	this.wkNorm = function(tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * v[i];
		}
		self.postMessage({handle: "vectorNorm", tag: tag, time: time, tot: tot});
	}

	this.wkDot = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * w.get(i);
		}
		self.postMessage({handle: "vectorSum", tag: tag, time: time, tot: tot});
	}

	this.wkSum = function(tag) {
		var time = util.getTime();
		var lb = util.loadBalance(that.length, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i];
		}
		self.postMessage({handle: "vectorSum", tag: tag, time: time, tot: tot});
	}

	this.timesMatrix = function(A) {

	}
}

MW.Vector.fromArray = function(arr, mathWorkerId, nWorkersInput) {
	var vec = new MW.Vector(arr.length, mathWorkerId, nWorkersInput);
	for (var i = 0; i < arr.length; ++i) {
		vec.set(i, arr[i]);
	}
	return vec;
}

