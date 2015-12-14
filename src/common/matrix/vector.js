(function() {

    MathWorkers.Vector = function(length, datatype) {
        this.datatype = datatype || MathWorkers.Datatype.Float32;
        this.length = length || 0;
        this.array = null;
        if (this.length > 0) {
            this.array = MathWorkers.util.newTypedArray(this.length, this.datatype);
        }
    };

    MathWorkers.Vector.fromArray = function(array, datatype) {
        var tmpArray = MathWorkers.util.copyTypedArray(array, datatype)
        var tmp = new MathWorkers.Vector(0, datatype);
        tmp.length = tmpArray.length;
        tmp.array = tmpArray;
        return tmp;
    };

    MathWorkers.Vector.zeros = function(length, datatype) {
        var vec = new MathWorkers.Vector(length, datatype);
        for (var i = 0; i < length; ++i) {
            vec.array[i] = 0.0;
        }
        return vec;
    };

    MathWorkers.Vector.ones = function(length, datatype) {
        var vec = new MathWorkers.Vector(length, datatype);
        for (var i = 0; i < length; ++i) {
            vec.array[i] = 1.0;
        }
        return vec;
    };

    MathWorkers.Vector.random = function(length, datatype) {
        // TODO: fill with different random things depending on datatype
        var vec = new MathWorkers.Vector(length, datatype);
        for (var i = 0; i < length; ++i) {
            vec.array[i] = Math.random();
        }
        return vec;
    };

    MathWorkers.Vector.prototype.map = function(func) {
        for (var i = 0; i < this.length; i++) {
            this.array[i] = func(this.array[i]);
        }
        return this;
    };

    MathWorkers.Vector.prototype.scale = function(a) {
        for (var i = 0; i < this.length; i++) {
            this.array[i] *= a;
        }
        return this;
    };

}());
