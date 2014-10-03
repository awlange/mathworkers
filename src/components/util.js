
/**
 *  General internal utility functions
 */
var util = {}
util.loadBalance = function(n, nWorkers, id) {
	var div = Math.floor(n / nWorkers);
	var rem = n % nWorkers;

	// naive way
	// var ifrom = id * div;
	// var ito = ifrom + div;
	// if (id == nWorkers-1) {
	// 	ito += rem;  // simple minded way for now
	// }

	// distribute remainder as evenly as possible
	var ifrom;
	var ito;
	if (id < rem) {
		ifrom = id * (div + 1);
		ito = ifrom + div + 1;
	} else {
		ifrom = id * div + rem;
		ito = ifrom + div;
	}

	return {ifrom: ifrom, ito: ito};
}

