/**
 *  Homebrewed simple unit testing stuff for MathWorkers
 */
var UnitTester = (function() {

// Global variables
var T = {};
var EPSILON = 0.00000001;  // threshold for testing double precision equalities here


T.Tester = function(testName) {
	var that = this;
	var pass = false;
	var tests = [];
	var name = testName;

	// Test functions
	this.passed = function() {
		pass = true;
		for (var i = 0; i < tests.length; ++i) {
			pass = pass && tests[i];
		}
		if (!pass) {
			console.log("Test(s) failed for: " + name); 
			console.log("Test list results:");
			console.log(tests);
		}
		updatePage();
	}

	this.isTrue = function(comparison) {
		tests.push(comparison == true);
	}

	this.isFalse = function(comparison) {
		tests.push(comparison == false);
	}

	this.equal = function(expected, actual) {
		tests.push(expected === actual); 
	};

	this.notEqual = function(expected, actual) {
		tests.push(expected !== actual); 
	};

	this.doubleEqual = function(expected, actual) {
		tests.push(Math.abs(expected - actual) <= EPSILON);
	}

	this.doubleNotEqual = function(expected, actual) {
		tests.push(Math.abs(expected - actual) > EPSILON);
	}

	this.vectorEqual = function(expected, actual) {
		var len = expected.length === actual.length;
		if (!len) {
			tests.push(false);
			return;
		}
		var elements = true;
		for (var i = 0; i < actual.length; ++i) {
			elements = elements && Math.abs(expected.get(i) - actual.get(i)) < EPSILON;
		}
		tests.push(elements);
	}

	// DOM manipulation functions
	var updatePage = function() {
		var elem = document.getElementById(name);
		if (pass) {
			elem.className = "passed";
			elem.innerHTML = "passed";
		} else {
			elem.className = "failed";
			elem.innerHTML = "failed";
		}
	}
}

return T;
}());