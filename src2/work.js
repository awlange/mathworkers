var workerId = 0;
var nWorkers = 1;

// script body
function body() {

	var vlen = 3000;
	var vec;
        var mat;
	if (false) {  // for node
		vec = [];
                for (var i = 0; i < vlen; i++) {
                        vec.push(i * 0.0001);
                }
	} else {
		vec = new Float64Array(vlen);
		for (var i = 0; i < vlen; i++) {
			vec[i] = i * 0.0001;
		}
		//mat = new Float64Array(vlen * vlen);
		mat = [];
		for (var i = 0; i < vlen; i++) {
			mat.push(new Float64Array(vlen));
			for (var j = 0; j < vlen; j++) {
				//mat[i*vlen + j] = 0.0;
				mat[i][j] = 0.0;
			}
			//mat[i*vlen + i] = 1.0;
			mat[i][i] = 1.0;
		}
	}

	// compute my dot
	// load balance
	var div = vlen / nWorkers;
	var rem = vlen % nWorkers;
	var ifrom = workerId * div;
	var ito = (workerId + 1) * div;
	if (workerId == nWorkers-1) {
		ito += rem;  // simple for now
	}

	/*
	var myDot = 0.0;
	for (var nt = 0; nt < 1; nt++) {
	for (var i = ifrom; i < ito; i++) {
		myDot += vec[i] * vec[i];
		//for (var j = 0; j < vlen; j++) {
		//	myDot += Math.exp(-(vec[i] * vec[j]));
		//}
	}
	}

	self.postMessage({myDot: myDot});
	*/

	var resultVector = new Float64Array(vlen);
	for (var i = ifrom; i < ito; i++) {
		var tmp = 0.0;
		for (var j = 0; j < vlen; j++) {
			//tmp += mat[i*vlen + j] * vec[j];
			tmp += mat[i][j] * vec[j];
		}
		resultVector[i] = tmp;
	}
	//self.postMessage({result: resultVector.buffer}, [resultVector.buffer]);

        // send mat object test <-- yeah, this works nicely! (I think)
	var matObject = {};
	var matBufferList = [];
	for (var i = 0; i < vlen; i++) {
		matObject[i] = mat[i].buffer;
		matBufferList[i] = mat[i].buffer;
	}
	self.postMessage(matObject, matBufferList);
}

function init(data) {
	workerId = data.workerId;
	nWorkers = data.nWorkers;
	console.log("setting id: " + workerId);
	body();
}

self.onmessage = function(event) {

	var data = event.data;
	switch(data.functionId) {
		case 1:
			init(data);
			break;
		default:
			console.log("kablammo");
	}
}
