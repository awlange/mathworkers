/**
 * Internal utility functions
 */
var util = function() {}

// Convert passed in function to a URL object, which can be passed to a Web Worker
util.functionToURL = function(fn) {
	// TODO: consider quickly minifying function somehow
	var blob = new Blob(["self.onmessage = " + fn.toString()], { type: "text/javascript" });
	var URL = window.URL || window.webkitURL;
	return URL.createObjectURL(blob);
}

// Returns an Array object of specified length with all values 0
util.getZeroesArray = function(n) {
	var arr = new Array();
	for (var i = 0; i < n; ++i) {
		arr.push(0);
	}
	return arr;
}

// Returns a typed array based on input. Possibilities:
// input = integer length of the new array
// input = typed array or ArrayBuffer to be copied
// input = object, such as an Array
util.newArray = function(type, input) {
	switch (type) {
		case "Int8":
			return new Int8Array(input);
		case "UInt8":
			return new UInt8Array(input);
		case "UInt8Clamped":
			return new UInt8ClampedArray(input);
		case "Int16":
			return new Int16Array(input);
		case "UInt16":
			return new UInt16Array(input);
		case "Int32":
			return new Int32Array(input);
		case "UInt32":
			return new UInt32Array(input);
		case "Float32":
			return new Float64Array(input);		
		case "Float64":
			return new Float64Array(input);
		default:
			if (input instanceof Number) {
			  return util.getZeroesArray(input);
			} else {
				return new Array(input);
			}
	}
}

