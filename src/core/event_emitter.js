// Copyright 2014 Adrian W. Lange

/**
 * Custom event emitter. To be inherited by classes involving events.
 * Based on example provided here:
 *
 * http://otaqui.com/blog/1374/event-emitter-pub-sub-or-deferred-promises-which-should-you-choose/
 *
 * @mixin
 */
function EventEmitter() {
    var events = {};

    /**
     * Sets an event to listen for
     *
     * @param {!string} name the event name
     * @param {function} callback the callback to be executed when the event is emitted
     */
    this.on = function(name, callback) {
        MathWorkers.util.checkFunction(callback);
        events[name] = [callback];
    };

    /**
     * Emits an event and executes the corresponding callback
     *
     * @param {!string} name the event name
     * @param {Array.<Object>} [args] an array of arguments to be passed to the callback
     */
    this.emit = function(name, args) {
        events[name] = events[name] || [];
        args = args || [];
        events[name].forEach( function(fn) {
            fn.call(this, args);
        });
    };
}

