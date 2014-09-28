
/**
 *  General internal utility functions
 */
var util = {}
util.loadBalance = function(n, nWorkers, id) {
	var div = Math.floor(n / nWorkers);
	var rem = n % nWorkers;
	var ifrom = id * div;
	var ito = (id + 1) * div;
	if (id == nWorkers-1) {
		ito += rem;  // simple minded way for now
	}
	return {ifrom: ifrom, ito: ito};
}

util.getTime = function() {
	return new Date().getTime();
}

util.deltaTime = function(time) {
	return new Date().getTime() - time;
}

