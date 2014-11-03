'use strict';
/* global Stream */

requireApp('system/lockscreen/js/stream/basic_stream.js');
requireApp('system/lockscreen/js/stream/stream.js');
suite('system/lockscreen/Stream >', function() {
  var subject;
  setup(function() {
    subject = new Stream();
  });
  suite('map', function() {
    test('it would map functions to every value', function(done) {
      var newStream =
        subject.map(function(val) { return val * 0; });
        newStream.reduce(function(acc, newval) {
          assert.equal(newval, 0,
            'it doesn\'t map the function to the values');
        })
        .then(done)
        .catch(done);

      // Ready to be notified.
      newStream.done();
      // Start to notify.
      subject
        .done()
        .then(function() {
          subject.notify(1);
          subject.notify(2);
          subject.notify(3);
          subject.notify(4);
          subject.notify(5);
          // Need to close it to get reducing result.
          subject.close();
        })
        .catch(done);
    });
  });
});
