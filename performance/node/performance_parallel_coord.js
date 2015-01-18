/*
 * node.js coordinator code
 * not to be executed by any worker processes
 */

var run = function(MathWorkers, coord) {

    // Loop size
    var nRuns = 10;

    // Start the events
    coord.onReady(function () {
        coord.trigger("set");
        coord.trigger("foo");
    });

    function createEventListener(eventName, triggerName, responseName) {
        coord.on(eventName, function () {
            var times = [];
            var r = 1;
            coord.trigger(triggerName);
            var start = new Date().getTime();

            coord.on(responseName, function () {
                var buffer = coord.getBuffer();
                times.push(new Date().getTime() - start);
                if (r >= nRuns) {
                    var stats = MathWorkers.Stats.summary(times);
                    console.log(stats);

                    // Disconnect to terminate program
                    coord.disconnect();
                } else {
                    coord.trigger(triggerName);
                    start = new Date().getTime();
                    r += 1;
                }
            });
        });
    }

    // The events to run
    //createEventListener("bar", "run_matrixMatrixProduct", "matrixMatrixProduct");
    createEventListener("bar", "run_vectorDot", "vectorDot");


};


exports.run = run;
