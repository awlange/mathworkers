console.log("Hello");

var messageHandler = function(event) {
  var data = event.data || event;
  switch (data.handle) {
    case "message":
      msg(data.message);
      break;
    case "vec":
      vec(data);
      break;
    default:
      console.error("dafuq");
  }
};

function msg(s) {
  console.log(s);
}



// Initialization and stuff
var pool = [];
var i;
var scriptName = "work.js";
var n_workers = 1;

var loadBalance = function(n, id) {
  id = id || 0;
  var div = (n / n_workers)|0;
  var rem = n % n_workers;

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

for (i = 0; i < n_workers; ++i) {
  worker = new Worker(scriptName);
  worker.postMessage({id: i, n_workers: n_workers, handle: "init"});
  worker.onmessage = messageHandler;
  pool.push(worker);
}

// Make some data
var N = 500000;
var v = new Float64Array(N);

var start;
var iter = 0;

for (i = 0; i < N; ++i) {
  v[i] = Math.random();
}

// Reduction
var n_reported = 0;
var objectBuffer = null;


function vec(data) {
  if (n_reported == 0) {
    objectBuffer = new Float64Array(data.len);
  }
  var tmpArray = new Float64Array(data.vectorBuffer);
  var lb = loadBalance(vec.length, data.id);
  var offset = lb.ifrom;
  for (var i = 0; i < tmpArray.length; ++i) {
    objectBuffer[offset + i] = tmpArray[i];
  }

  n_reported += 1;
  if (n_reported === n_workers) {
    // Execute callback or something
    console.log("iter: " + iter + " Time: " + (new Date().getTime() - start));
    //console.log(objectBuffer);

    iter += 1;
    if (iter < 5) {
      foo();
    } else {
      serial();
    }

    n_reported = 0;
  }
}

function foo() {
  start = new Date().getTime();

  // Send some data for computation. Scattered vector.
  for (i = 0; i < n_workers; ++i) {
    worker = pool[i];
    var lb = loadBalance(v.length, i);
    var subv = new Float64Array(v.subarray(lb.ifrom, lb.ito));
    var buf = subv.buffer;
    worker.postMessage({handle: "vec", vec: buf, len: v.length}, [buf]);
    worker.postMessage({handle: "compute2"});
  }
}

function serial() {
  for (i = 0; i < N; ++i) {
    v[i] = Math.random();
  }

  for (iter = 0; iter < 5; iter++) {
    start = new Date().getTime();
    for (var i = 0; i < v.length; i++) {
      //v[i] = Math.cos(Math.sqrt(v[i])) * 100.1;
      v[i] *= v[i];
    }
    console.log("iter: " + iter + " Time: " + (new Date().getTime() - start));
  }
}

foo();





