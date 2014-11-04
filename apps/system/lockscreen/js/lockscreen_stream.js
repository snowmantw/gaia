 'use strict';
 /* global Stream, Source */

/**
 * LockScreenStream that turn all native signals into the stream,
 * and then feed other children.
 *
 * It's in fact a builder and singleton of the stream. As a builder,
 * it would mix all relevant sources to build the stream, so that the
 * stream would contain signals from events, mozSetting changes,
 * timer and other possible sources. And other children Streams should
 * to the filtering from it to get the information it cares about.
 *
 * And as a singleton, every time people create the instance of this stream,
 * they would get the same instance. This is because of the model should
 * be one main Stream collecting and forwarding all native signals, and
 * be handled by various child streams. So to instantiate multiple
 * LockScreenStream is unwise.
 **/
(function(exports) {
  var LockScreenStream = function() {};
  LockScreenStream.prototype.instance = function() {
    if (LockScreenStream.stream) {
      return LockScreenStream.stream;
    }

    this.configs = {
      listens: [
        ''
      ],
      settings: [
        ''
      ]
    };
    var mixedStream = new Stream();
    // Since to contain all events in an array is simpler,
    // but the source require them to be this kind of PODs.
    var eventPairs = this.configs.listens.map((ename) => {
      return { 'type': ename };
    });
    mixedStream
      .source(Source.events(eventPairs))
      .source(Source.settings(this.configs.settings))
      .source(Source.bridge(
        { emitter: (emitter) => {
            // Necessary for state transferring.
            this.emitter = emitter;
          }
        }))
      .ready();
    LockScreenStream.stream = mixedStream;
    return mixedStream;
  };

  /**
   * To notify the stream that we now have a state transferring.
   * Note: this is a way to keep compatibility. If we can move to
   * the whole FRP model, we may need manage no states anymore.
   */
  LockScreenStream.prototype.transfer = function(from, to) {
    if (!LockScreenStream.stream) {
      return;
    }
    if (!LockScreenStream.stream.isready) {
      console.warn('try to emit transferring before the stream is ready');
      return;
    }
    console.log('>> >> this >> ', typeof this.emitter);
    if (!this.emitter) {
      console.error('try to emit transferring while there is not emitter');
      return;
    }
    this.emitter({
      'from': from,
      'to': to
    });
    return this;
  };

  exports.LockScreenStream = LockScreenStream;
})(window);

