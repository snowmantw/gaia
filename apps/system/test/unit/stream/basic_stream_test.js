'use strict';

/* global BasicStream */

requireApp('system/lockscreen/js/stream/basic_stream.js');
suite('system/LockScreen/BasicStream >', function() {
  var subject;
  setup(function() {
    subject = new BasicStream();
  });
  suite('start with', function() {
    test('it would feed values only after we start it', function(done) {
      var calleds = [];
      var check = function(newval) {
        calleds.push(newval);
        return newval;
      };
      subject
        .start('some special value in a number stream')
        .reduce(function(acc, newval) {
            check(newval);
          }, null)
        .then(function() {
          assert.equal(calleds[0], 'some special value in a number stream',
            'it didn\'t perform the reducing after start');
          assert.equal(calleds[1], 99,
            'it didn\'t perform the reducing after start');
        })
        .then(done)
        .catch(done);

      assert.equal(calleds.length, 0,
        'it performs the reducing even we didn\'t start it');
      subject.notify(99);
      assert.equal(calleds.length, 0,
        'it performs the notifying even we didn\'t set it up');
      subject
        .done()
        .then(function() {
          // Only after we set the stream up, the notify works.
          subject.notify(99);
          // need to close it to execute the final check steps of the reducing.
          subject.close();
        })
        .catch(done);

    });
  });

  suite('set source', function(done) {
    test('it would be fed when source has new value', function() {
      var StubSource = function() {
        this.collector = function(notify, close) {
          this.notify = notify;
          this.close = close;
        };
      };
      var stubSource = new StubSource();
      subject
        .start(1)
        .source(stubSource)
        .reduce(function(acc, newval) {
          return acc + newval;
        }, 0)
        .then(function(finalacc) {
          assert.equal(finalacc, 100,
            'the source did\'t emit value');
        })
        .then(done)
        .catch(done);
      subject
        .done()
        .then(function() {
          stubSource.notify(99);
          subject.close();
        }).catch(done);
    });
  });

  suite('boardcast notification', function() {
    var stubSubStream;
    setup(function() {
      subject.isdone = true;
      stubSubStream = {
        notify: this.sinon.stub()
      };
      subject.observe(stubSubStream);
      subject.observe(stubSubStream);
    });
    test('it would boardcast notifications to all substreams', function() {
      subject.notify(1);
      assert.isTrue(stubSubStream.notify.calledTwice,
        'it didn\'t notify the substreams');
    });
  });
});
