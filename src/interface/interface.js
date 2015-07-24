// Copyright 2014 Adrian W. Lange

/**
 * Interface to MathWorkers for easier programming
 *
 * @namespace MathWorkers.Interface
 */
MathWorkers.Interface = new EventEmitter();

MathWorkers.Interface.run = function(firstTag, nWorkers, pathToMathWorkers) {

  // Object reference
  var that = this;

  // Temporary storage of Vectors and Matrixes
  this.v = null;
  this.w = null;
  this.u = null;
  this.A = null;
  this.B = null;
  this.C = null;

  // Start the coordinator
  nWorkers = nWorkers || 1;
  pathToMathWorkers = pathToMathWorkers || "./mathworkers.js";
  this.coordinator = new MathWorkers.Coordinator(nWorkers, pathToMathWorkers);
  this.worker = null;

  if (MathWorkers.Global.isMaster()) {
    // If this is the master thread, then execute the callback with the first tag
    this.coordinator.onReady(function() {
      that.emit(firstTag);
    });
  } else if (MathWorkers.Global.isWorker()) {
    // If this is a worker thread, then create a worker
    this.worker = new MathWorkers.MathWorker();
  }

  // Coordinator events
  if (MathWorkers.Global.isMaster()) {

  }

  // Worker events
  if (MathWorkers.Global.isWorker()) {

    this.worker.on("_sendVectorToWorkers_v", function() {
      that.v = that.worker.getBuffer();
      that.worker.sendDataToCoordinator({}, "_done_sendVectorToWorkers_v");
    });

    this.worker.on("_sendVectorToWorkers_w", function() {
      that.w = that.worker.getBuffer();
      that.worker.sendDataToCoordinator({}, "_done_sendVectorToWorkers_w");  // TODO: trigger
    });

    this.worker.on("_sendMatrixToWorkers_A", function() {
      that.A = that.worker.getBuffer();
      that.worker.sendDataToCoordinator({}, "_done_sendMatrixToWorkers_A");
    });

    this.worker.on("_sendMatrixToWorkers_B", function() {
      that.B = that.worker.getBuffer();
      that.worker.sendDataToCoordinator({}, "_done_sendMatrixToWorkers_B");
    });

    this.worker.on("_vDotw", function() {
      that.v.workerDotVector(that.w, "_done_vDotw");
    });

    this.worker.on("_ADotv", function() {
      that.A.workerDotVector(that.v, "_done_ADotv");
    });
  }

};

MathWorkers.Interface.disconnect = function() {
  this.coordinator.disconnect();
};

MathWorkers.Interface.vectorDotVector = function(v, w, tag) {
  var that = this;
  // TODO: Could be sent asynchronously?
  // TODO: Distributed vector
  this.coordinator.sendVectorToWorkers(w, "_sendVectorToWorkers_w");
  this.coordinator.on("_done_sendVectorToWorkers_w", function() {
    that.coordinator.sendVectorToWorkers(v, "_sendVectorToWorkers_v");
  });
  this.coordinator.on("_done_sendVectorToWorkers_v", function() {
    that.coordinator.trigger("_vDotw");
  });
  this.coordinator.on("_done_vDotw", function() {
    that.emit(tag, that.coordinator.getBuffer());
  });
};

MathWorkers.Interface.matrixDotVector = function(A, v, tag) {
  var that = this;
  this.coordinator.sendMatrixToWorkers(A, "_sendMatrixToWorkers_A");
  this.coordinator.on("_done_sendMatrixToWorkers_A", function() {
    that.coordinator.sendVectorToWorkers(v, "_sendVectorToWorkers_v");
  });
  this.coordinator.on("_done_sendVectorToWorkers_v", function() {
    that.coordinator.trigger("_ADotv");
  });
  this.coordinator.on("_done_ADotv", function() {
    that.emit(tag, that.coordinator.getBuffer());
  });
};
