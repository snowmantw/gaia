'use strict';
/* global Stream */

requireApp('system/lockscreen/js/stream/basic_stream.js');
requireApp('system/lockscreen/js/stream/stream.js');
suite('system/lockscreen/Stream >', function() {
  var subject;
  setup(function() {
    subject = new Stream();
  });

  suite('length', function() {
    test('it has correct length', function(done) {
      subject.length()
      .then(function(length) {
        assert.equal(length, 5,
          'it don\'t provide the correct length');
      })
      .then(done).catch(done);

      // Ready for notifying it.
      subject.done();
      for (var i = 0; i < 5; i++) {
        subject.notify(i);
      }
      // Let the reducing done.
      subject.close();
    });
  });

  suite('map', function() {
    test('it would map functions to every value', function(done) {
      subject
        .map(function(val) { return val * 0; })
        .reduce(function(acc, newval) {
          assert.equal(newval, 0,
            'it doesn\'t map the function to the values');
        })
        .then(done)
        .catch(done);

      // Start to notify.
      subject
        .done()
        .then(function() {
          for (var i = 0; i < 5; i++) {
            subject.notify(i);
          }
          // Need to close it to get reducing result.
          subject.close();
        })
        .catch(done);
    });
  });

  suite('filter', function() {
    test('it would filter elements of the Stream', function(done) {
      subject
        .filter(function(val) { return val > 0; })
        .reduce(function(acc, newval) {
          assert.isTrue(newval > 0,
            'it doesn\'t filter out the values');
          return acc + 1;
        }, 0)
        .then(function(counter) {
          assert.equal(counter, 3,
            'it doesn\'t filter out the values');
        })
        .then(done)
        .catch(done);

      // Start to notify.
      subject
        .done()
        .then(function() {
          for (var i = -3; i < 4; i++) {
            subject.notify(i);
          }
          // Need to close it to get reducing result.
          subject.close();
        })
        .catch(done);
    });
  });

  suite('flat', function() {
    test('it would flat every elements in deep arrays', function(done) {
      subject
        .flat()
        .reduce(function(acc, newval) {
          assert.isFalse(Array.isArray(newval[0]),
            'it doesn\'t flat the values');
        })
        .then(done)
        .catch(done);

      // Start to notify.
      subject
        .done()
        .then(function() {
          for (var i = 0; i < 5; i ++) {
            subject.notify([[[i], i+1, i+2], i+3, [1+4, i+5]]);
          }
          // Need to close it to get reducing result.
          subject.close();
        })
        .catch(done);
    });
  });

  suite('and', function() {
    var stream1, stream2;
    setup(function() {
      stream1 = new Stream();
      stream2 = new Stream();
    });
    test('it would merge two streams into one new stream', function(done) {
      stream2
        .and(stream1)
        .reduce(function(acc, newvals) {
          return newvals[0] + newvals[1];
        }, 0)
        .then(function(result) {
          assert.equal(result, 8,
            'the values from these two streams are not correct.');
        })
        .then(done)
        .catch(done);

      // Now trigger the notifying to do the test.
      stream1.done().then(function() {
        for (var i = 0; i < 5; i ++) {
          stream1.notify(i);
        }
      })
      .catch(done);

      stream2
        .done()
        .then(function() {
          for (var i = 4; i >= 0; i --) {
            stream2.notify(i);
          }
          // Need to close it to get reducing result.
          // 'and' need only close one stream to perform the reducing,
          // but for test we still close them all.
          stream2.close();
          stream1.close();
        })
        .catch(done);
    });
  });

  suite('or', function() {
    var stream1, stream2;
    setup(function() {
      stream1 = new Stream();
      stream2 = new Stream();
    });
    test('it would merge two streams into one new Either stream.',
    function(done) {
      stream2
        .or(stream1)
        .reduce(function(acc, newval) {
          if (null === acc) {
            acc = 0;
          }
          return acc + newval;
        }, null)
        .then(function(result) {
          assert.equal(result, 0,
            'the values from these two streams are not correct.');
        })
        .then(done)
        .catch(done);

      // Now trigger the notifying to do the test.
      stream1.done().then(function() {
        for (var i = -4; i < 0; i ++) {
          stream1.notify(i);
        }
      })
      .catch(done);

      stream2
        .done()
        .then(function() {
          for (var i = 4; i > 0; i --) {
            stream2.notify(i);
          }
          // Need to close them to get reducing result.
          stream2.close();
          stream1.close();
        })
        .catch(done);
    });
  });
});
