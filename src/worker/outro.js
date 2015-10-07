    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    return new MathWorker.Worker(0, isNode);

})();
