/*
 * node.js coordinator code
 * not to be executed by any worker processes
 */

var run = function(MWs, coord) {

    console.log("Hey, am I a master process? : " + MWs.Global.isMaster());

    var nRuns = 10;

    coord.onReady(function () {
        coord.trigger("set");
        coord.trigger("foo");
    });

    coord.on("bar", function () {
        var messageList = coord.getMessageDataList();
        console.log(messageList);

        var times = [];
        var r = 1;
        coord.trigger("run_matrixMatrixProduct");
        var start = new Date().getTime();

        coord.on("matrixMatrixProduct", function () {
            var buffer = coord.getBuffer();
            times.push(new Date().getTime() - start);
            if (r >= nRuns) {
                var stats = MWs.Stats.summary(times);
                console.log(stats);

                // Disconnect to terminate program
                coord.disconnect();
            } else {
                coord.trigger("run_matrixMatrixProduct");
                start = new Date().getTime();
                r += 1;
            }
        });
    });
};


exports.run = run;