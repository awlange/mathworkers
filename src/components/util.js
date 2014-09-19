/**
 * Internal utility functions
 */
var util = function() {}

// Returns a typed array based on input. Possibilities:
// input = integer length of the new array
// input = typed array or ArrayBuffer to be copied
// input = object, such as an Array
util.newArray = function(type, input) {
	switch (type) {
		case "Int32":
			return new Int32Array(input);
		case "UInt32":
			return new UInt32Array(input);
		case "Float32":
			return new Float64Array(input);		
		case "Float64":
			return new Float64Array(input);
		default:
			console.error("Invalid type for newArray.");
			return null;
	}
}

// So that it may be passed along to the worker
var utilNewArrayAsString = "\nvar util = function() {}; util.newArray = " + util.newArray.toString();

// Convert passed in function to a URL object, which can be passed to a Web Worker
util.functionToURL = function(fn) {
	// TODO: consider quickly minifying function somehow
	var str = "self.onmessage = " + fn.toString() + utilNewArrayAsString;
	var blob = new Blob([str], { type: "text/javascript" });
	var URL = window.URL || window.webkitURL;
	return URL.createObjectURL(blob);
}


