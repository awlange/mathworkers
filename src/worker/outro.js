    var isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';
    console.log(isNode);
    return new MathWorker.Worker(0, isNode);

})();
