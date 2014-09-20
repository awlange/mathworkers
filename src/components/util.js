/**
 * Internal utility functions
 */
var util = function() {}

// Returns a typed array based on input. Possibilities:
// input = integer length of the new array
// input = typed array or ArrayBuffer to be copied
// input = object, such as an Array
util.newTypedArray = function(type, input) {
	return new Float64Array(input);
	// switch (type) {
	// 	case "Int32":
	// 		return new Int32Array(input);
	// 	case "UInt32":
	// 		return new UInt32Array(input);
	// 	case "Float32":
	// 		return new Float64Array(input);		
	// 	case "Float64":
	// 		return new Float64Array(input);
	// 	default:
	// 		console.error("Invalid type for newArray.");
	// 		return null;
	// }
}

// So that it may be passed along to the worker
var utilNewTypedArrayAsString = "\nvar util = function() {}; util.newTypedArray = " + util.newTypedArray.toString();

// Convert passed in function to a URL object, which can be passed to a Web Worker
util.functionToURL = function(fn) {
	// TODO: consider quickly minifying function somehow
	var str = "self.onmessage = " + fn.toString() + utilNewTypedArrayAsString;
	var blob = new Blob([str], { type: "text/javascript" });
	var URL = window.URL || window.webkitURL;
	return URL.createObjectURL(blob);
}

util.workerScript = util.functionToURL( function(event) {
	var data = event.data;
	var mat = util.newTypedArray(data.type, data.mat);
	var vec = util.newTypedArray(data.type, data.vec);
	var len = data.rto - data.rfrom;

	var result = util.newTypedArray(data.type, len);
	for (var i = 0; i < len; ++i) {
		var tot = 0.0;
		var incols = i * vec.length;
		for (var j = 0; j < vec.length; ++j) {
			tot += mat[incols + j] * vec[j];
		}
		result[i] = tot;
	}
	postMessage({
		result: result.buffer, 
		rfrom: data.rfrom,
		rto: data.rto
	}, [result.buffer]);
	postMessage({});
	//self.close();  // terminates the worker
});


