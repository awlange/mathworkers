// Copyright 2014 Adrian W. Lange

/**
 *  Logging controller
 *
 *  levels:
 *  < 1 = no printing
 *  1   = error + info 
 *  2   = error + info + warning (the default level)
 *  > 2 = error + info + warning + debug
 */
Logger = function() {
	var name = "";
	var level = 3;

	this.setLevel = function(nameInput, val) {
		if (val !== undefined && val !== null) {
			name = nameInput;
			level = val;
		}
	};

	this.error = function(message) {
		if (level >= 1) {
			console.error("ERROR:" + name + ": " + message);
		}
	};

	this.info = function(message) {
		if (level >= 1) {
			console.info("INFO:" + name + ": " + message);
		}
	};

	this.warn = function(message) {
		if (level >= 2) {
			console.warn("WARN:" + name + ": " + message);
		}
	};

	this.debug = function(message) {
		if (level >= 3) {
			console.log("DEBUG:" + name + ": " + message);
		}
	};
};

var log = new Logger();

