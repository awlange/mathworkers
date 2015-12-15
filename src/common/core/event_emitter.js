/**
 * Custom event emitter. To be inherited by classes involving events.
 * Based on example provided here:
 *
 * http://otaqui.com/blog/1374/event-emitter-pub-sub-or-deferred-promises-which-should-you-choose/
 *
 * @mixin
 */
(function() {
    MathWorkers.EventEmitter = function() {
        var events = {};

        /**
         * Sets an event to listen for
         *
         * @param {!string} name the event name
         * @param {function} callback the callback to be executed when the event is emitted
         * @param {Array.<Object>} [args] optional array of arguments to be passed on event
         */
        this.on = function(name, callback, args) {
            args = args || [];
            events[name] = {"callback": callback, "args": args};
            return this;
        };

        /**
         * Emits an event and executes the corresponding callback
         *
         * @param {!string} name the event name
         * @param {Array.<Object>} [args] an array of arguments to be passed to the callback
         */
        this.emit = function(name, args) {
            events[name] = events[name] || {};
            args = args || events[name]["args"] || [];
            events[name]["callback"].call(this, args);
            return this;
        };
    }
}());

