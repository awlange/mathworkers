/**
 *  Homebrewed simple unit testing stuff for MathWorkers
 */
var UnitTester = (function() {

// Global MathWorkers variables
var T = {};

T.Tester = function(testName) {
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
			console.log("Test(s) failed. Test list results:");
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