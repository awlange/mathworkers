var myId = -1;
var n_workers = 1;
var v;
var totalLength = 0;
var ready = false;

var loadBalance = function(n, id) {
  id = id || myId;
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

self.onmessage = function(event) {
  var data = event.data || event;
  switch (data.handle) {
    case "init":
      init(data);
      break;
    case "compute1":
      compute1(data);
      break;
    case "vec":
      recv_vec(data);
      break;
    case "compute2":
      compute2(data);
      break;
    default:
      console.error("dafuq");
  }
};

function init(data) {
  myId = data.id;
  n_workers = data.n_workers;
  var msg = "Hello from worker " + myId + " of " + n_workers;
  self.postMessage({message: msg, handle: "message"});
}

function compute1(data) {
  var array = data.array;
}

function recv_vec(data) {
  v = new Float64Array(data.vec);
  totalLength = data.len;
  // send message to say complete
  ready = true;
}

function compute2(data) {
  while (!ready) {
    setTimeout(function() {}, 1);
  }
  for (var i = 0; i < v.length; i++) {
    //v[i] = Math.cos(Math.sqrt(v[i])) * 100.1;
    v[i] *= v[i];
  }
  ready = false;
  var buf = v.buffer;

  self.postMessage({handle: "vec", id: myId, len: totalLength, vectorBuffer: buf}, [buf]);
}

