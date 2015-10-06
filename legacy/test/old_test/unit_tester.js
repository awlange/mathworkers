/**
 *  Homebrewed simple unit testing stuff for MathWorkers
 */
(function() {
var isNode = false; // node.js
var UnitTester = (function() {

// Global variables
var T = {};
var EPSILON = 10e-12;  // threshold for testing double precision equalities here

T.Tester = function(testName) {
	this.pass = true;
    this.name = testName;
	this.tests = [];

	// Test functions
	this.passed = function() {
		for (var i = 0; i < this.tests.length; ++i) {
			this.pass = this.pass && this.tests[i];
		}
		if (!this.pass) {
			console.log("Test(s) failed for: " + this.name);
			console.log("Test list results:");
			console.log(this.tests);
		}
		this.updatePage();
	};

	this.isTrue = function(comparison) {
		this.tests.push(comparison == true);
	};

	this.isFalse = function(comparison) {
		this.tests.push(comparison == false);
	};

	this.equal = function(expected, actual) {
		this.tests.push(expected === actual); 
	};

	this.notEqual = function(expected, actual) {
		this.tests.push(expected !== actual); 
	};

	this.doubleEqual = function(expected, actual) {
		this.tests.push(Math.abs(expected - actual) <= EPSILON);
	};

	this.doubleNotEqual = function(expected, actual) {
		this.tests.push(Math.abs(expected - actual) > EPSILON);
	};

	this.vectorEqual = function(expected, actual) {
		if (!(expected.length === actual.length)) {
			this.tests.push(false);
			return;
		}
		var elements = true;
		for (var i = 0; i < actual.length && elements; ++i) {
			elements = elements && Math.abs(expected.array[i] - actual.array[i]) < EPSILON;
		}
		this.tests.push(elements);
	};

	this.matrixEqual = function(expected, actual) {
		if (!(expected.nrows === actual.nrows) || !(expected.ncols === actual.ncols)) {
			this.tests.push(false);
			return;
		}
		var elements = true;
		for (var i = 0; i < actual.nrows && elements; ++i) {
			for (var j = 0; j < actual.ncols && elements; ++j) {
				elements = elements && Math.abs(expected.array[i][j] - actual.array[i][j]) < EPSILON;
			}
		}
		this.tests.push(elements);
	};

	// DOM manipulation function(s)
	this.updatePage = function() {
		if (isNode) {
			return;
		}
		var elem = document.getElementById(this.name);
		if (this.pass) {
			elem.className = "passed";
			elem.innerHTML = "passed";
		} else {
			elem.className = "failed";
			elem.innerHTML = "failed";
		}
	}
};

return T;
})();


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	// Exporting for node.js
	isNode = true;
	module.exports = UnitTester;
} else if (typeof window !== 'undefined') {
	// Exporting for browser
	window.UnitTester = UnitTester;
} else {
	// Exporting for web worker
	self.UnitTester = UnitTester;
}
})();