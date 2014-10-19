// Copyright 2014 Adrian W. Lange

/**
 *  Custom event emitter
 */
function EventEmitter() {
    var events = {};

    this.on = function(name, callback) {
        events[name] = [callback];
    };

    this.emit = function(name, args) {
        events[name] = events[name] || [];
        args = args || [];
        events[name].forEach( function(fn) {
            fn.call(this, args);
        });
    };
}

