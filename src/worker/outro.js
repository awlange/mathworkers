if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    // Exporting for node.js
    module.exports = MathWorker;
} else if (typeof window !== 'undefined') {
    // Exporting for browser
    window.MathWorker = MathWorker;
} else {
    // Exporting for web worker
    self.MathWorker = MathWorker;
}

})();
