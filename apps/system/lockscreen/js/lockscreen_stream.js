 'use strict';
 /* global Stream, Source */

/**
 * LockScreenStream is as a builder and facade to extend the basic Stream
 * with LockScreen specific functions and sources. It would collect all
 * signals that LockScreen needs to know, and child streams can handle them
 * via the reducing methods like 'map' and 'filter'.
 *
 * The LockScreenStream should be a singleton but this restriction should not
 * be applied via the class itself. This is because in some cases like for
 * testing, singleton would result in some troubles.
 **/
(function(exports) {
  var LockScreenStream = function() {
    this.configs = {
      events: [],
      settings: []
    };
    this.stream = null;
  };

  /**
   * User can use this method to set the stream up and reduce the returning
   * stream. This actually do the building things and pass the stream out.
   */
  LockScreenStream.prototype.setup = function() {
    // All LockScreen events should be collected via 'window'.
    var eventsMap = this.configs.events.map((ename) => {
      return {
        'type': ename,
        'target': window
      };
    });
    this.stream = new Stream();
    this.stream.foo = 123;
    this.stream
      .source(Source.events(eventsMap))
      .source(Source.settings(this.configs.settings))
      .source(Source.bridge({
        'emitter': (emitter) => {
          this.emitter = emitter;
        }
      }))
      .ready();
    return this.stream;
  };

  /**
   * Method to keep compatibility. If we migrate to stream model we may need no
   * explicit state transferring anymore.
   *
   * Note this method must be called after the stream is set up.
   */
  LockScreenStream.prototype.transfer = function(from, to) {
    this.emitter({
      'fromState': from,
      'toState': to
    });
    return this;
  };

  exports.LockScreenStream = LockScreenStream;
})(window);

