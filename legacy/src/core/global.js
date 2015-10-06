// Copyright 2014 Adrian W. Lange

// TODO: This can probably be combined with the var global
/**
 * Methods that affect global behavior of MathWorkers.
 *
 * @namespace MathWorkers.Global
 */
MathWorkers.Global = {};

/**
 * Retrieve the MathWorkers code version
 *
 * @returns {string}
 */
MathWorkers.Global.getVersion = function () {
    return global.version;
};

// Globally scoped useful variables, defaults
global.workerPool = [];
global.nWorkers = 1;
global.myWorkerId = 0;

global.logLevel = 1;
/**
 * <p>Sets the MathWorkers log level:</p>
 * <ul>
 *   <li> 1 = warnings and errors only </li>
 *   <li> 2 = verbose logging </li>
 * </ul>
 * <p>Default is 1.</p>
 *
 * @param {!number} logLevel level to be set
 * @memberof MathWorkers.Global
 * @function setLogLevel
 */
MathWorkers.Global.setLogLevel = function(logLevel) {
    if (!MathWorkers.util.nullOrUndefined(logLevel)) {
        global.logLevel = logLevel;
    }
};

global.unrollLoops = false;
/**
 * <p>Loop unrolling option:</p>
 * <ul>
 *   <li>If true, use loop unrolled versions of functions if available.</li>
 *   <li>If false, do not use loop unrolling.</li>
 * </ul>
 * <p>Default is false.</p>
 *
 * @param {!boolean} unroll option to be set
 * @memberof MathWorkers.Global
 * @function setUnrollLoops
 */
MathWorkers.Global.setUnrollLoops = function(unroll) {
    MathWorkers.util.checkNullOrUndefined(unroll);
    global.unrollLoops = unroll;
};

/**
 * Creates the internal worker pool.
 * Attempts to use node.js cluster workers first.
 * Then checks if Web Worker supported in browser.
 *
 * @ignore
 */
global.createPool = function(nWorkersInput, workerScriptName) {

    var i, worker;

    function createInitData(i) {
        return {
            handle: "_init", id: i, nWorkers: nWorkersInput,
            logLevel: global.logLevel, unrollLoops: global.unrollLoops
        };
    }

    if (global.isNode) {
        // Node.js cluster workers
        global.nodeCluster = require("cluster");
        if (global.nodeCluster.isMaster) {
            for (i = 0; i < nWorkersInput; ++i) {
                worker = global.nodeCluster.fork();
                worker.send(createInitData(i));
                this.workerPool.push(worker);
                this.nWorkers = this.workerPool.length;
            }
        } else if (global.nodeCluster.isWorker) {
            // worker loads script here
            require(workerScriptName);
        }
    } else {
        // HTML5 Web Workers
        MathWorkers.util.checkWebWorkerSupport();
        for (i = 0; i < nWorkersInput; ++i) {
            worker = new Worker(workerScriptName);
            worker.postMessage(createInitData(i));
            this.workerPool.push(worker);
            this.nWorkers = this.workerPool.length;
        }
    }

    this.getWorker = function(workerId) {
        return this.workerPool[workerId];
    };
};

global.isNode = false;
global.nodeCluster = {};
/**
 * Turn off/on node.js mode
 *
 * @param node {!boolean} node.js mode to be set
 * @function setNode
 */
MathWorkers.Global.setNode = function(node) {
    MathWorkers.util.checkNullOrUndefined(node);
    global.isNode = node;
};

// TODO: temporary
MathWorkers.Global.isMaster = function() {
    return global.isNode && global.nodeCluster && global.nodeCluster.isMaster;
};
MathWorkers.Global.isWorker = function() {
    return global.isNode && global.nodeCluster && global.nodeCluster.isWorker;
};
