    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    return new MathWorkers.Worker(0, isNode);

})();
