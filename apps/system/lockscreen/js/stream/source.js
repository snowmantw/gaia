 'use strict';

/**
 * The source of Stream. It provide multiple adapter interfaces to build sources
 * of Stream from various native APIs.
 *
 * Source would call stream's 'notify' method to generate the stream implicitly,
 * and every Stream should contain one or more Source.
 **/
(function(exports) {
  var Source = function() {
    // Delay the timimg to emit the elements,
    // since when we get the source, the collector
    // may stay undefined.
    this.collectorResolver = null;
    this.promisedCollector = new Promise((resolve) => {
      this.collectorResolver = resolve;
    });

    // Keep them here for debugging.
    this.iterator =
    this.events =
    this.settings =
    this.timer = null;  // timer: { id: ID, times: times }

    // We need to use setInterval trick for infinite iterator.
    // See: 'Source.interator'
    this.iterationID = null;
  };

  /**
   * From any iterator. The thing could be finite or infinite.
   * This means the thing must implement the 'iterator protocol' in ES6.
   *
   * Note: we can't use any plain loop to iterate the iterator, since if it's
   * infinite, we would block main thread. So we can only use setInterval trick
   * to make sure we can iterate both kinds of iterators.
   */
  Source.iterator = function(iterator) {
    var source = new Source();
    source.iterator = iterator;
    source.promisedCollector.then(() => {
      source.iteration = window.setInterval(() => {
        var current = source.iterator.next();
        if (current.done) {
          window.clearInterval(source.iterationID);
        }
        source.emit(current.value);
      }, 4);  // 4ms is the minimum according to HTML5#setTimeout.
    });
    return source;
  };

  /**
   * A specialized version of 'Source.iterator', which avoids the 'setInterval'
   * trick, since an array is always finite, so we can use the plain loop.
   */
  Source.array = function(array) {
    var source = new Source();
    source.iterator = array;
    source.promisedCollector.then(() => {
      array.forEach((item) => {
        source.emit(item);
      });
      // Let source know we're done, and this is a finite source.
      source.terminator();
    });
    return source;
  };

  /**
   * Give a list of pair of event names and targets.
   * Targets is optional, since most of events can be received via binding
   * on the global 'window' object.
   *
   * So the format is:
   *
   *    [{ type: eventType, target: targetDOM }]
   */
  Source.events = function(events) {
    var source = new Source();
    source.promisedCollector.then(() => {
      events.forEach((pair) => {
        var {type, target} = pair;
        if (!target) {
          target = window;
        }
        target.addEventListener(type, source);
      });
    });
    return source;
  };

  /**
   * Listen changes from mozSettings API.
   */
  Source.settings = function(keys) {
    var source = new Source();
    source.promisedCollector.then(() => {
      keys.forEach((key) => {
        navigator.mozSettings.addObserver(key,
          source.emit.bind(source));
      });
    });
    return source;
  };

  /**
   * Set since timeout or interval timer.
   * The generator is for generating some value while time is up.
   * If there is no 'times' then it's a permanent interval timer.
   */
  Source.timer = function(timeout, generator, times) {
    var source = new Source();
    source.promisedCollector.then(() => {
      var timerfunction = () => {
        if (times && 0 === source.timer.times) {
          window.clearInterval(source.timer.id);
          // clean the timer and close the source.
          source.terminator();
          return;
        } else if (times) {
          source.timer.times --;
        }
        source.emit(generator());
      };
      source.timer = {
        id: setInterval(timerfunction, timeout),
        times: times
      };
    });
    return source;
  };

  /**
   * Set the stream in entry to let source emit the new value.
   * The first argument is the method to collect emitted item,
   * and the second one is the method to signal the end of emitting.
   */
  Source.prototype.collector =
  function(collector, terminator = function() {}) {
    this.collector = collector;
    this.collectorResolver(collector);
    this.terminator = terminator;
    return this;
  };

  /**
   * Emit the value to Stream when it's ready.
   * Need keep 'handleEvent' since event API relies on it.
   */
  Source.prototype.handleEvent =
  Source.prototype.emit = function(item) {
    this.collector(item);
  };

  exports.Source = Source;
})(window);

