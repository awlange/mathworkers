
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

	this.getVector = function() {
		return v;
	}

	this.setVector = function(w) {
		v = w;
		that.length = w.length;
	}

	this.sendToCoordinator = function(tag) {
		// only id 0 does the sending actually
		if (id == 0) {
			var time = util.getTime();
			self.postMessage({handle: "vectorSendToCoordinator", tag: tag, time: time,
				vectorBuffer: v.buffer}, [v.buffer]);
		}
	}

	this.dot = function(w, tag) {
		var time = util.getTime();
		var lb = util.loadBalance(size, nWorkers, id);
		var tot = 0.0;
		for (var i = lb.ifrom; i < lb.ito; ++i) {
			tot += v[i] * w.get(i);
		}
		self.postMessage({handle: "vectorDot", tag: tag, time: time, dot: tot});
	}
}
