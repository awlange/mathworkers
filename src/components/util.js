// Copyright 2014 Adrian W. Lange

/**
 *  General internal utility functions
 */
var util = {};
util.loadBalance = function(n) {
    var id = pool.myWorkerId;
	var div = Math.floor(n / pool.nWorkers);
	var rem = n % pool.nWorkers;

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
};

