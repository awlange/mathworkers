/*
* Serial node tests
*/

var MWs = require("../../../dist/mathworkers.js");
var UT = require("../unit_tester.js");

var Vector = MWs.Vector;
var Matrix = MWs.Matrix;
var util = MWs.util;
var serialTests = [];
var nTests = 0;
var passes = 0;

function updatePasses(T) {
    nTests += 1;
    if (T.pass) {
        passes += 1;
    }
}

// Vector tests
serialTests.push( function() {
    var T = new UT.Tester("sum");
    var v = Vector.fromArray([1.0, 2.0, -30.0]);
    var sum = v.sum();
    T.doubleEqual(-27.0, sum);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("product");
    var v = Vector.fromArray([1.0, 2.0, -30.0]);
    var prod = v.product();
    T.doubleEqual(-60.0, prod);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("plus");
    var v = new MWs.Vector(3);
    var w = new MWs.Vector(3);
    for (var i = 0; i < 3; ++i) {
        v.array[i] = i;
        w.array[i] = i * 2.0;
    }
    var plus = v.plus(w);
    var expected = Vector.fromArray([0.0, 3.0, 6.0]);
    T.vectorEqual(expected, plus);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("minus");
    var v = new MWs.Vector(3);
    var w = new MWs.Vector(3);
    for (var i = 0; i < 3; ++i) {
        v.array[i] = (i+1) * 2.0;
        w.array[i] = i+1;
    }
    var minus = v.minus(w);
    var expected = Vector.fromArray([1.0, 2.0, 3.0]);
    T.vectorEqual(expected, minus);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("times");
    var v = Vector.fromArray([1.0, 2.0, 3.0]);
    var w = Vector.fromArray([4.0, 8.0, -3.0]);
    var times = v.times(w);
    var expected = Vector.fromArray([4.0, 16.0, -9.0]);
    T.vectorEqual(expected, times);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("divide");
    var v = Vector.fromArray([1.0, 8.0, 3.0]);
    var w = Vector.fromArray([4.0, 2.0, -3.0]);
    var div = v.divide(w);
    var expected = Vector.fromArray([0.25, 4.0, -1.0]);
    T.vectorEqual(expected, div);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("scale");
    var v = Vector.fromArray([0.25, 4.0, -30.0]);
    var sc = v.scale(2.0);
    var expected = Vector.fromArray([0.50, 8.0, -60.0]);
    T.vectorEqual(expected, sc);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("apply");
    var v = Vector.fromArray([1.0, 2.0, -3.0]);
    var app = v.apply(Math.exp);
    var expected = Vector.fromArray([Math.exp(1.0), Math.exp(2.0), Math.exp(-3.0)]);
    T.vectorEqual(expected, app);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("dotVector");
    var v = Vector.fromArray([0.0, 1.0, 2.0, 3.0, 4.0]);
    var w = Vector.fromArray([0.0, 2.0, 4.0, 6.0, 8.0]);
    var dot = v.dotVector(w);
    T.doubleEqual(60.0, dot);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("vectorDotMatrix");
    var v = Vector.fromArray([1.0, 2.0, 3.0]);
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var w = v.dotMatrix(A);
    T.vectorEqual(Vector.fromArray([30.0, 36.0, 42.0]), w);
    T.passed();
    updatePasses(T);
});

// Matrix tests
serialTests.push( function() {
    var T = new UT.Tester("matrixZeroes");
    T.matrixEqual(Matrix.fromArray([[0.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 0.0]]), Matrix.zeroes(3, 4));
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixIdentity");
    T.matrixEqual(Matrix.fromArray([[1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 1.0]]), Matrix.identity(3));
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixCopyRow");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var vec = [0.0, 0.0, 0.0];
    A.copyRow(1, vec);
    T.doubleEqual(vec[0], 4.0);
    T.doubleEqual(vec[1], 5.0);
    T.doubleEqual(vec[2], 6.0);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixCopyColumn");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var vec = [0.0, 0.0, 0.0];
    A.copyColumn(1, vec);
    T.doubleEqual(vec[0], 2.0);
    T.doubleEqual(vec[1], 5.0);
    T.doubleEqual(vec[2], 8.0);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixPlus");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
    var C = A.plus(B);
    T.matrixEqual(Matrix.fromArray([[4.0, 4.0, 4.0], [10.0, 10.0, 10.0], [16.0, 16.0, 16.0]]), C);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixMinus");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
    var C = A.minus(B);
    T.matrixEqual(Matrix.fromArray([[-2.0, 0.0, 2.0], [-2.0, 0.0, 2.0], [-2.0, 0.0, 2.0]]), C);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixTimes");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
    var C = A.times(B);
    T.matrixEqual(Matrix.fromArray([[3.0, 4.0, 3.0], [24.0, 25.0, 24.0], [63.0, 64.0, 63.0]]), C);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixDivide");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var B = Matrix.fromArray([[3.0, 2.0, 1.0], [6.0, 5.0, 4.0], [9.0, 8.0, 7.0]]);
    var C = A.divide(B);
    T.matrixEqual(Matrix.fromArray([[1.0/3.0, 1.0, 3.0], [4.0/6.0, 1.0, 6.0/4.0], [7.0/9.0, 1.0, 9.0/7.0]]), C);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixScale");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var C = A.scale(3.0);
    T.matrixEqual(Matrix.fromArray([[3.0, 6.0, 9.0], [12.0, 15.0, 18.0], [21.0, 24.0, 27.0]]), C);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixApply");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var C = A.apply(Math.sqrt);
    T.matrixEqual(Matrix.fromArray([[1.0, Math.sqrt(2.0), Math.sqrt(3.0)],
        [2.0, Math.sqrt(5.0), Math.sqrt(6.0)],
        [Math.sqrt(7.0), Math.sqrt(8.0), 3.0]]), C);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixDotVector");
    var v = Vector.fromArray([1.0, 2.0, 3.0]);
    var A = Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]);
    var w = A.dotVector(v);
    T.vectorEqual(Vector.fromArray([14.0, 32.0, 50.0]), w);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixTransposeSquare");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [7.0, 8.0, 9.0]]);
    T.matrixEqual(Matrix.fromArray([[1.0, 4.0, 7.0],
        [2.0, 5.0, 8.0],
        [3.0, 6.0, 9.0]]), A.transpose());
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixTransposeRect");
    var A = Matrix.fromArray([[1.0, 2.0, 3.0, 4.0, 5.0],
        [6.0, 7.0, 8.0, 9.0, 10.0],
        [11.0, 12.0, 13.0, 14.0, 15.0]]);
    T.matrixEqual(Matrix.fromArray([[1.0, 6.0, 11.0],
        [2.0, 7.0, 12.0],
        [3.0, 8.0, 13.0],
        [4.0, 9.0, 14.0],
        [5.0, 10.0, 15.0]]), A.transpose());
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixDotMatrix1");
    var A = Matrix.fromArray([[1.0, 2.0],
        [2.0, 3.0]]);
    var B = Matrix.fromArray([[-3.0, 2.0],
        [1.0, -2.0]]);
    var AB = A.dotMatrix(B);
    T.matrixEqual(Matrix.fromArray([[-1.0, -2.0],
        [-3.0, -2.0]]), AB);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixDotMatrix2");
    var A = Matrix.fromArray([[1.0, 2.0],
        [2.0, 3.0]]);
    var B = Matrix.fromArray([[-3.0, 2.0],
        [1.0, -2.0]]);
    var BA = B.dotMatrix(A);
    T.matrixEqual(Matrix.fromArray([[1.0, 0.0],
        [-3.0, -4.0]]), BA);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixDotMatrix3");
    var A = Matrix.fromArray([[1.0, 2.0],
        [2.0, 3.0]]);
    var C = Matrix.fromArray([[1.0, 0.0, -2.0],
        [0.0, 1.0, 1.0]]);
    var AC = A.dotMatrix(C);
    T.matrixEqual(Matrix.fromArray([[1.0, 2.0, 0.0],
        [2.0, 3.0, -1.0]]), AC);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixDotMatrix4");
    var C = Matrix.fromArray([[1.0, 0.0, -2.0],
        [0.0, 1.0, 1.0]]);
    var D = Matrix.fromArray([[3.0, 1.0],
        [-1.0, -2.0],
        [1.0, 1.0]]);
    var CD = C.dotMatrix(D);
    T.matrixEqual(Matrix.fromArray([[1.0, -1.0],
        [0.0, -1.0]]), CD);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("matrixDotMatrix5");
    var C = Matrix.fromArray([[1.0, 0.0, -2.0],
        [0.0, 1.0, 1.0]]);
    var D = Matrix.fromArray([[3.0, 1.0],
        [-1.0, -2.0],
        [1.0, 1.0]]);
    var DC = D.dotMatrix(C);
    T.matrixEqual(Matrix.fromArray([[3.0, 1.0, -5.0],
        [-1.0, -2.0, 0.0],
        [1.0, 1.0, -1.0]]), DC);
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkNullOrUndefined");
    T.tests = [true, false, false];
    try {
        util.checkNullOrUndefined("banana");
        util.checkNullOrUndefined(3.0);
        util.checkNullOrUndefined(true);
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkNullOrUndefined(null);
    } catch (err) {
        T.tests[1] = true;
    }
    try {
        util.checkNullOrUndefined(undefined);
    } catch (err) {
        T.tests[2] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkNumber");
    T.tests = [true, false];
    try {
        util.checkNumber(400.0);
        util.checkNumber(-7);
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkNumber("banana");
    } catch (err) {
        T.tests[1] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkFunction");
    T.tests = [true, false];
    try {
        util.checkFunction(function() {});
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkFunction("banana");
    } catch (err) {
        T.tests[1] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkArray");
    T.tests = [true, false];
    try {
        util.checkArray([1.0, 2.0, 3.0]);
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkArray("banana");
    } catch (err) {
        T.tests[1] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkFloat64Array");
    T.tests = [true, false, false];
    try {
        util.checkFloat64Array(new Float64Array(3));
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkFloat64Array("banana");
    } catch (err) {
        T.tests[1] = true;
    }
    try {
        util.checkFloat64Array([]);
    } catch (err) {
        T.tests[2] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkVector");
    T.tests = [true, false, false];
    try {
        util.checkVector(new Vector(3));
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkVector("banana");
    } catch (err) {
        T.tests[1] = true;
    }
    try {
        util.checkVector(null);
    } catch (err) {
        T.tests[2] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkVectors");
    T.tests = [true, false, false, false];
    try {
        util.checkVectors(new Vector(5), new Vector(5));
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkVectors(new Vector(10), new Vector(20));
    } catch (err) {
        T.tests[1] = true;
    }
    try {
        util.checkVectors(null, new Vector(3));
    } catch (err) {
        T.tests[2] = true;
    }
    try {
        util.checkVectors(new Vector(3), null);
    } catch (err) {
        T.tests[3] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkMatrix");
    T.tests = [true, false, false];
    try {
        util.checkMatrix(new Matrix(5, 4));
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkMatrix(new Vector(10));
    } catch (err) {
        T.tests[1] = true;
    }
    try {
        util.checkMatrix(null);
    } catch (err) {
        T.tests[2] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkMatrices");
    T.tests = [true, false, false, false, false];
    try {
        util.checkMatrices(new Matrix(5, 4), new Matrix(5, 4));
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkMatrices(new Vector(10), new Matrix(5, 4));
    } catch (err) {
        T.tests[1] = true;
    }
    try {
        util.checkMatrices(null, new Matrix(3, 2));
    } catch (err) {
        T.tests[2] = true;
    }
    try {
        util.checkMatrices(new Matrix(2, 2), new Matrix(3, 2));
    } catch (err) {
        T.tests[3] = true;
    }
    try {
        util.checkMatrices(new Matrix(2, 2), new Matrix(2, 3));
    } catch (err) {
        T.tests[4] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkMatrixVector");
    T.tests = [true, false, false, false, false];
    try {
        util.checkMatrixVector(new Matrix(5, 4), new Vector(4));
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkMatrixVector(new Vector(4), new Matrix(5, 4));
    } catch (err) {
        T.tests[1] = true;
    }
    try {
        util.checkMatrixVector(null, new Vector(4));
    } catch (err) {
        T.tests[2] = true;
    }
    try {
        util.checkMatrixVector(new Matrix(5, 4), new Vector(3));
    } catch (err) {
        T.tests[3] = true;
    }
    try {
        util.checkMatrixVector(new Matrix(2, 2), null);
    } catch (err) {
        T.tests[4] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkVectorMatrix");
    T.tests = [true, false, false, false, false];
    try {
        util.checkVectorMatrix(new Vector(5), new Matrix(5, 4));
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkVectorMatrix(new Vector(4), new Matrix(5, 4));
    } catch (err) {
        T.tests[1] = true;
    }
    try {
        util.checkVectorMatrix(null, new Matrix(5, 4));
    } catch (err) {
        T.tests[2] = true;
    }
    try {
        util.checkVectorMatrix(new Vector(5), null);
    } catch (err) {
        T.tests[3] = true;
    }
    try {
        util.checkVectorMatrix(new Matrix(2, 2), new Vector(2));
    } catch (err) {
        T.tests[4] = true;
    }
    T.passed();
    updatePasses(T);
});

serialTests.push( function() {
    var T = new UT.Tester("checkMatrixMatrix");
    T.tests = [true, true, false, false, false];
    try {
        util.checkMatrixMatrix(new Matrix(5, 4), new Matrix(4, 3));
    } catch (err) {
        T.tests[0] = false;
    }
    try {
        util.checkMatrixMatrix(new Matrix(2, 2), new Matrix(2, 2));
    } catch (err) {
        T.tests[1] = false;
    }
    try {
        util.checkMatrixMatrix(null, new Matrix(5, 4));
    } catch (err) {
        T.tests[2] = true;
    }
    try {
        util.checkMatrixMatrix(new Matrix(5, 4), null);
    } catch (err) {
        T.tests[3] = true;
    }
    try {
        util.checkMatrixMatrix(new Matrix(2, 2), new Vector(2));
    } catch (err) {
        T.tests[4] = true;
    }
    T.passed();
    updatePasses(T);
});


serialTests.forEach( function(fn) {
    fn.call(this);
});

console.log(passes + " passed of " + nTests + " tests.");
