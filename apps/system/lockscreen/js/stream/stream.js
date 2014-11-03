 'use strict';
 /* global BasicStream */

/**
 * The full functional Stream. Instead of using the BasicStream,
 * user can benefit from this version with multiple sugar methods.
 *
 * Note: since Stream may be infinite or finite, methods can only
 * be promised to 'return' the result after it's actually finite and
 * the method end its job. And since the most basic 'reduce' method
 * from the BasicStream is immutable, which means the reducing function
 * should give a whole new BasicStream or Stream to do the reducing,
 * rather than manipulate the original Stream every time, methods of
 * this constructor would be immutable, too.
 **/
(function(exports) {
  var Stream = function() {
    BasicStream.apply(this);
  };
  Stream.prototype = Object.create(BasicStream.prototype);

  /**
   * mapper:: a -> b
   */
  Stream.prototype.map = function(mapper) {
    var newStream = new Stream();
    this.reduce((acc, newval) => {
      return acc.notify(mapper(newval));
    }, newStream)
    .then(function() {
      // If parent stream closed, close the child, too.
      newStream.close();
    }).catch(console.error.bind(console));
    return newStream;
  };

  /**
   * pred:: a -> bool
   */
  Stream.prototype.filter = function(pred) {
    var newStream = new Stream();
    this.reduce((acc, newval) => {
      if (pred(newval)) {
        return acc.notify(newval);
      }
    }, newStream)
    .then(function() {
      // If parent stream closed, close the child, too.
      newStream.close();
    }).catch(console.error.bind(console));
    return newStream;
  };

  /**
   * Flat every Stream elements within arrays.
   */
  Stream.prototype.flat = function() {
    var newStream = new Stream();
    // Must recursively do this.
    // Result would be the flatArray.
    var doFlat = (flatArray, value) => {
      if (Array.isArray(value)) {
        value.forEach((elem) => {
          doFlat(flatArray, elem);
        });
      } else {
        flatArray.push(value);
      }
    };

    this.reduce((acc, newval) => {
      var result = [];
      doFlat(result, newval);
      return acc.notify(result);
    }, newStream)
    .then(function() {
      // If parent stream closed, close the child, too.
      newStream.close();
    }).catch(console.error.bind(console));
    return newStream;
  };

  /**
   * Give another stream and generate a new Stream.
   * It would generate tuples of two Streams' elements as
   * new Stream's values (since we're in JavaScript, we can
   * only use Array(2) instread of real tuple).
   *
   * If any of these two Streams get closed, the new
   * Stream would get closed, too.
   */
  Stream.prototype.and = function(stream) {
    var newStream = new Stream();
    var resolverRef = {
      resolve: null,
      values: []
    };
    this.reduce((acc0, newval0) => {
      var promise = new Promise((resolve) => {
        resolverRef.resolve = resolve;
        resolverRef.values[0] = newval0;
      });
      promise.then(() => {
        newStream.notify(resolverRef.values);
        resolverRef = {
          resolve: null,
          values: []
        };
      });
    }, null).then(function() {
      newStream.close();
    }).catch(console.error.bind(console));

    stream.reduce((acc1, newval1) => {
      resolverRef.values[1] = newval1;
      resolverRef.resolve();
    }, null).then(function() {
      newStream.close();
    }).catch(console.error.bind(console));
    return newStream;
  };

  /**
   * Since we don't really have parallel streams,
   * there would be only one element in the OR array element of the stream.
   * This makes it as an Either Stream, actually.
   *
   * Note: if both Stream get closed, the new Stream would get closed, too.
   */
  Stream.prototype.or = function(stream) {
    var anotherStreamClosed = false;
    var newStream = new Stream();
    stream.reduce((acc, newval) => {
      return acc.notify(newval);
    }, newStream)
    .then(function() {
      if (anotherStreamClosed) {
        newStream.close();
      } else {
        anotherStreamClosed = true;
      }
    })
    .catch(console.error.bind(console));

    this.reduce((acc, newval) => {
      return acc.notify(newval);
    }, newStream)
    .then(function() {
      if (anotherStreamClosed) {
        newStream.close();
      } else {
        anotherStreamClosed = true;
      }
    })
    .catch(console.error.bind(console));

    return newStream;
  };

  exports.Stream = Stream;
})(window);

