/*
 * coordinator code for node.js parallel units tests
 */

var UT = require("../unit_tester.js");

var run = function(MWs, crd) {

    var Vector = MWs.Vector;
    var Matrix = MWs.Matrix;

    var nTests = 0;
    var passes = 0;

    function updatePasses(T) {
        nTests += 1;
        if (T.pass) {
            passes += 1;
        }
    }

    crd.onReady(function () {
        crd.trigger("run_sendDataToCoordinator");
    });

    crd.on("sendDataToCoordinator", function () {
        var T = new UT.Tester("sendDataToCoordinator");
        var messageList = crd.getMessageDataList();
        T.equal("Hello from worker 0 of 2 workers.", messageList[0]);
        T.equal("Hello from worker 1 of 2 workers.", messageList[1]);
        T.passed();
        updatePasses(T);

        crd.sendDataToWorkers(12345, "run_sendDataToWorkers");
    });

    crd.on("sendDataToWorkers", function() {
        var T = new UT.Tester("sendDataToWorkers");
        var messageList = crd.getMessageDataList();
        T.equal("Data received by worker 0: 12345", messageList[0]);
        T.equal("Data received by worker 1: 12345", messageList[1]);
        T.passed();
        updatePasses(T);

        crd.trigger("run_sendVectorToCoordinator");
    });

    crd.on("sendVectorToCoordinator", function() {
        var T = new UT.Tester("sendVectorToCoordinator");
        var recv = crd.getBuffer();
        var vec = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
        T.vectorEqual(vec, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_sendMatrixToCoordinator");
    });

    crd.on("sendMatrixToCoordinator", function() {
        var T = new UT.Tester("sendMatrixToCoordinator");
        var recv = crd.getBuffer();
        var mat = Matrix.fromArray([[0.0, 1.0], [2.0, 3.0]]);
        T.matrixEqual(mat, recv);
        T.passed();
        updatePasses(T);

        var vec = Vector.fromArray([0.0, 1.0, 2.0]);
        crd.sendVectorToWorkers(vec, "run_sendVectorToWorkers");
    });

    crd.on("sendVectorToWorkers", function() {
        var T = new UT.Tester("sendVectorToWorkers");
        var vec = Vector.fromArray([0.0, 1.0, 2.0]);
        var messageList = crd.getMessageDataList();
        T.equal(vec.toString(), messageList[0]);
        T.equal(vec.toString(), messageList[1]);
        T.passed();
        updatePasses(T);

        var mat = Matrix.fromArray([[0.0, 1.0], [2.0, 3.0]]);
        crd.sendMatrixToWorkers(mat, "run_sendMatrixToWorkers");
    });

    crd.on("sendMatrixToWorkers", function() {
        var T = new UT.Tester("sendMatrixToWorkers");
        var mat = Matrix.fromArray([[0.0, 1.0], [2.0, 3.0]]);
        var messageList = crd.getMessageDataList();
        T.equal(mat.toString(), messageList[0]);
        T.equal(mat.toString(), messageList[1]);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorDotVector");
    });

    crd.on("vectorDotVector", function() {
        var T = new UT.Tester("vectorDotVector");
        var recv = crd.getBuffer();
        T.doubleEqual(20.0, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorSum");
    });

    crd.on("vectorSum", function() {
        var T = new UT.Tester("vectorSum");
        var recv = crd.getBuffer();
        T.doubleEqual(1500.0, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorProduct");
    });

    crd.on("vectorProduct", function() {
        var T = new UT.Tester("vectorProduct");
        var recv = crd.getBuffer();
        T.doubleEqual(120.0, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorPlus");
    });

    crd.on("vectorPlus", function() {
        var T = new UT.Tester("vectorPlus");
        var recv = crd.getBuffer();
        var vec = Vector.fromArray([0.0, 2.0, 4.0, 6.0, 8.0]);
        T.vectorEqual(vec, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorMinus");
    });

    crd.on("vectorMinus", function() {
        var T = new UT.Tester("vectorMinus");
        var recv = crd.getBuffer();
        var vec = Vector.fromArray([1.0, 1.0, 1.0, 1.0, 1.0]);
        T.vectorEqual(vec, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorTimes");
    });

    crd.on("vectorTimes", function() {
        var T = new UT.Tester("vectorTimes");
        var recv = crd.getBuffer();
        var vec = Vector.fromArray([0.0, 2.0, 6.0, 12.0, 20.0]);
        T.vectorEqual(vec, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorDivide");
    });

    crd.on("vectorDivide", function() {
        var T = new UT.Tester("vectorDivide");
        var recv = crd.getBuffer();
        var vec = Vector.fromArray([0.0, 2.0, -2.0, 0.25, 1.0]);
        T.vectorEqual(vec, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorScale");
    });

    crd.on("vectorScale", function() {
        var T = new UT.Tester("vectorScale");
        var recv = crd.getBuffer();
        var vec = Vector.fromArray([2.0, 4.0, 6.0, 8.0, 10.0]);
        T.vectorEqual(vec, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorApply");
    });

    crd.on("vectorApply", function() {
        var T = new UT.Tester("vectorApply");
        var recv = crd.getBuffer();
        var vec = Vector.fromArray([Math.sqrt(1.0), Math.sqrt(2.0), Math.sqrt(3.0), Math.sqrt(4.0), Math.sqrt(5.0)]);
        T.vectorEqual(vec, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorDotMatrix");
    });

    crd.on("vectorDotMatrix", function() {
        var T = new UT.Tester("vectorDotMatrix");
        var recv = crd.getBuffer();
        T.vectorEqual(Vector.fromArray([30.0, 36.0, 42.0]), recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixDotVector");
    });

    crd.on("matrixDotVector", function() {
        var T = new UT.Tester("matrixDotVector");
        var recv = crd.getBuffer();
        T.vectorEqual(Vector.fromArray([14.0, 32.0, 50.0]), recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixPlus");
    });

    crd.on("matrixPlus", function() {
        var T = new UT.Tester("matrixPlus");
        var recv = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[4.0, 4.0, 4.0], [10.0, 10.0, 10.0], [16.0, 16.0, 16.0]]), recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixMinus");
    });

    crd.on("matrixMinus", function() {
        var T = new UT.Tester("matrixMinus");
        var recv = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[-2.0, 0.0, 2.0], [-2.0, 0.0, 2.0], [-2.0, 0.0, 2.0]]), recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixTimes");
    });

    crd.on("matrixTimes", function() {
        var T = new UT.Tester("matrixTimes");
        var recv = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[3.0, 4.0, 3.0], [24.0, 25.0, 24.0], [63.0, 64.0, 63.0]]), recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixDivide");
    });

    crd.on("matrixDivide", function() {
        var T = new UT.Tester("matrixDivide");
        var recv = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[1.0/3.0, 1.0, 3.0], [4.0/6.0, 1.0, 6.0/4.0], [7.0/9.0, 1.0, 9.0/7.0]]), recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixScale");
    });

    crd.on("matrixScale", function() {
        var T = new UT.Tester("matrixScale");
        var recv = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[3.0, 6.0, 9.0], [12.0, 15.0, 18.0], [21.0, 24.0, 27.0]]), recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixApply");
    });

    crd.on("matrixApply", function() {
        var T = new UT.Tester("matrixApply");
        var recv = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[1.0, Math.sqrt(2.0), Math.sqrt(3.0)],
            [2.0, Math.sqrt(5.0), Math.sqrt(6.0)],
            [Math.sqrt(7.0), Math.sqrt(8.0), 3.0]]), recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixDotMatrix1");
    });

    crd.on("matrixDotMatrix1", function() {
        var T = new UT.Tester("matrixDotMatrix1");
        var AB = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[-1.0, -2.0], [-3.0, -2.0]]), AB);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixDotMatrix2");
    });

    crd.on("matrixDotMatrix2", function() {
        var T = new UT.Tester("matrixDotMatrix2");
        var BA = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[1.0, 0.0], [-3.0, -4.0]]), BA);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixDotMatrix3");
    });

    crd.on("matrixDotMatrix3", function() {
        var T = new UT.Tester("matrixDotMatrix3");
        var AC = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[1.0, 2.0, 0.0], [2.0, 3.0, -1.0]]), AC);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixDotMatrix4");
    });

    crd.on("matrixDotMatrix4", function() {
        var T = new UT.Tester("matrixDotMatrix4");
        var CD = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[1.0, -1.0], [0.0, -1.0]]), CD);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixDotMatrix5");
    });

    crd.on("matrixDotMatrix5", function() {
        var T = new UT.Tester("matrixDotMatrix5");
        var DC = crd.getBuffer();
        T.matrixEqual(Matrix.fromArray([[3.0, 1.0, -5.0], [-1.0, -2.0, 0.0], [1.0, 1.0, -1.0]]), DC);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorDotRebroadcast");
    });

    crd.on("vectorDotRebroadcast", function() {
        var T = new UT.Tester("vectorDotRebroadcast");
        var messageList = crd.getMessageDataList();
        T.equal(15000.0, messageList[0]);
        T.equal(15000.0, messageList[1]);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorTimesMatrixRebroadcast");
    });

    crd.on("vectorTimesMatrixRebroadcast", function() {
        var T = new UT.Tester("vectorTimesMatrixRebroadcast");
        var messageList = crd.getMessageDataList();
        T.isTrue(messageList[0]);
        T.isTrue(messageList[1]);
        T.passed();
        updatePasses(T);

        crd.trigger("run_vectorLinearCombination");
    });

    crd.on("vectorLinearCombination", function() {
        var T = new UT.Tester("vectorLinearCombination");
        var vectors = [
            Vector.fromArray([1.0, 2.0, 3.0]),
            Vector.fromArray([5.0, 8.0, 22.0]),
            Vector.fromArray([-1.0, 200.0, -30.0])
        ];
        var coefficients = [0.5, 20.0, -7.7];
        var v = vectors[0].scale(coefficients[0])
            .plus(vectors[1].scale(coefficients[1]))
            .plus(vectors[2].scale(coefficients[2]));
        var recv = crd.getBuffer();
        T.vectorEqual(v, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixLinearCombination");
    });

    crd.on("matrixLinearCombination", function() {
        var T = new UT.Tester("matrixLinearCombination");
        var matrices = [
            Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]),
            Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]),
            Matrix.fromArray([[30.0, 20.0, 10.0], [60.0, 50.0, 40.0], [90.0, 80.0, 70.0]])];
        var coefficients = [0.5, 20.0, -1.0];
        var S0 = matrices[0].scale(coefficients[0]);
        var S1 = matrices[1].scale(coefficients[1]);
        var S2 = matrices[2].scale(coefficients[2]);
        var M = S0.plus(S1).plus(S2);
        var recv = crd.getBuffer();
        T.matrixEqual(M, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixMatrixPlus1");
    });

    crd.on("matrixMatrixPlus1", function() {
        var T = new UT.Tester("matrixMatrixPlus1");
        var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
        var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
        var C = Matrix.fromArray([[30.0, 20.0, 10.0], [60.0, 50.0, 40.0], [90.0, 80.0, 70.0]]);
        var alpha = 0.38;
        var beta = -0.77;
        var M = A.dotMatrix(B).scale(alpha).plus(C.scale(beta));
        var recv = crd.getBuffer();
        T.matrixEqual(M, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixMatrixPlus2");
    });

    crd.on("matrixMatrixPlus2", function() {
        var T = new UT.Tester("matrixMatrixPlus2");
        var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
        var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
        var alpha = 0.38;
        var M = A.dotMatrix(B).scale(alpha);
        var recv = crd.getBuffer();
        T.matrixEqual(M, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixVectorPlus1");
    });

    crd.on("matrixVectorPlus1", function() {
        var T = new UT.Tester("matrixVectorPlus1");
        var A = Matrix.fromArray([
            [1.0, 2.0, 3.0],
            [4.0, 5.0, 6.0],
            [7.0, 8.0, 9.0]
        ]);
        var x = Vector.fromArray([2.0, 4.0, 8.0]);
        var y = Vector.fromArray([-5.0, -7.0, -9.0]);
        var alpha = 0.45;
        var beta = -10.0;
        var z = A.dotVector(x).scale(alpha).plus(y.scale(beta));
        var recv = crd.getBuffer();
        T.matrixEqual(z, recv);
        T.passed();
        updatePasses(T);

        crd.trigger("run_matrixVectorPlus2");
    });

    crd.on("matrixVectorPlus2", function() {
        var T = new UT.Tester("matrixVectorPlus2");
        var A = Matrix.fromArray([
            [1.0, 2.0, 3.0],
            [4.0, 5.0, 6.0],
            [7.0, 8.0, 9.0]
        ]);
        var x = Vector.fromArray([2.0, 4.0, 8.0]);
        var alpha = 0.45;
        var z = A.dotVector(x).scale(alpha);
        var recv = crd.getBuffer();
        T.matrixEqual(z, recv);
        T.passed();
        updatePasses(T);

        // Last test
        finished();
    });

    function finished() {
        // When done with the tests, call this to report test results and exit the program.
        console.log(passes + " passed of " + nTests + " tests.");
        crd.disconnect();
    }
};

exports.run = run;