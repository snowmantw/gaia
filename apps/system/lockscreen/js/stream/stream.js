 'use strict';
 /* global Promise */

/**
 * Reactive stream to manipulate the future.
 * Every manipulation would generate a new Stream.
 **/
(function(exports) {
  var Stream = function() {
    this.sources = [];
    this.observers = [];
    this.reducer =
    this.reducingDone =
    this.accumulatedValue =
    this.startResolver = null;
    this.startPromise = new Promise((resolve) => {
      this.startResolver = resolve;
    });
  };

  /**
   * This stream would start to work only after start it.
   * Must set sources before this step, and they would start
   * to feed this stream after we start it.
   */
  Stream.prototype.start = function(startWith) {
    this.notify(startWith);
    this.startResolver();
    return this;
  };

  /**
   * Register a source to continue the Stream.
   */
  Stream.prototype.source = function(source) {
    // It's OK to call this function multiple times, which is equal to:
    //
    //  somePromise.then();
    //  somePromise.then();
    //  somePromise.then();
    //
    // And these then would execute at the same time. Since we're preparing
    // the sources, so the order is not important.
    this.startPromise.then(() => {
      this.sources.push(source.collector(
        this.notify.bind(this),
        this.close.bind(this)));
    });
    return this;
  };

  /**
   * The reducer function is not the same with ES5.1's, since we don't
   * provide the 'index' and 'array' argument, but only the 'previousValue'
   * and 'currentValue'.
   *
   * And since Stream may be an infinite Stream, try to reduce and use it
   * would never get result (since the reducing time is infinite). This is
   * true for every attempts that try to 'get and use value' via the reducer.
   * Instead of, user should treat this function as the 'generator' of the
   * new notifiable object, which would be implicitly notified everytime the
   * parent Stream get triggered, and generate the new value. A proper way
   * to handle this new value is to embed it as another Stream's new element.
   *
   * For instance, if we want to implement 'map+1' via 'reduce', as other real
   * Functional Languages does:
   *
   *     Stream.reduce((acc, newval) => {
   *       // To embed the new element into the Stream,
   *       // via our observing-notifying interface.
   *       return acc.notify(newval + 1);
   *       // aka. acc ++ Stream(newval + 1)
   *       // aka. acc ++ [newval + 1]
   *     }, new Stream());
   *
   * And since we don't have native lazy-evaluation, we can only use Promise
   * to let caller now whether we get ended or not.
   */
  Stream.prototype.reduce = function(reducer, initValue) {
    var promised = new Promise((resolve) => {
      this.reducingDone = resolve;
    });
    this.reducer = reducer;
    this.accumulatedValue = initValue;
    return promised;
  };

  /**
   * If this Stream is finite and it's now ended,
   * call the close.
   */
  Stream.prototype.close = function() {
    if (null !== this.reducingDone) {
      this.reducingDone(this.accumulatedValue);
    }
    return this;
  };

  Stream.prototype.notify = function(value) {
    // If there is a reducing continues:
    if (null !== this.reducer) {
      this.accumulatedValue = this.reducer(this.accumulatedValue, value);
    } else {
      this.accumulatedValue = value;
    }
    this.observers.forEach((observer) => {
      observer.notify(value);
    });
    return this;
  };

  Stream.prototype.observe = function(observer) {
    this.observers.push(observer);
    return this;
  };
  exports.Stream = Stream;
})(window);

