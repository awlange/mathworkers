(function(){

    var Vector = function(length, datatype) {
        this.datatype = datatype || MathWorkers.Datatype.Float32;
        this.length = length || 0;
        this.array = null;
        if (this.length > 0) {
            this.array = MathWorkers.util.newTypedArray(this.length, this.datatype);
        }
    };

    Vector.prototype.random = function(length, datatype) {
        var vec = new Vector(length, datatype);
        for (var i = 0; i < size; ++i) {
            vec.array[i] = Math.random();
        }
        return vec;
    };

    MathWorkers.Vector = Vector;

}());
