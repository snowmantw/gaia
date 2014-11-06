'use strict';
/* global LockScreenStream */

requireApp('system/lockscreen/js/stream/basic_stream.js');
requireApp('system/lockscreen/js/stream/stream.js');
requireApp('system/lockscreen/js/lockscreen_stream.js');
suite('system/lockscreen/Stream >', function() {
  var subject;
  var collectors;
  setup(function() {
    collectors = {
      events: null,
      settings: null
    };
    window.Source = {
      events: function() {
        return {
          collector: function(collector, terminator) {
            collectors.events = collector;
          }
        };
      },
      settings: function(collector, terminator) {
        return {
          collector: function(collector, terminator) {
            collectors.settings = collector;
          }
        };
      },
      bridge: function() {
        return {
          collector: function(collector, terminator) {
            collectors.settings = collector;
          }
        };
      }
    };
    subject = new LockScreenStream();
  });

  suite('events & settings', function() {
    test('would receive events & settings', function(done) {
      var hasEvent = false;
      var hasSetting = false;
      subject
        .setup()
        .reduce(function(acc, newval) {
          if (newval.type && 'foo' === newval.type) {
            hasEvent = true;
          }
          if (newval.settingName && 'barname' === newval.settingName) {
            hasSetting = true;
          }
        })
        .then(function() {
          assert.isTrue(hasEvent,
            'did\'t receive events as element of the stream');
          assert.isTrue(hasSetting,
            'did\'t receive settings as element of the stream');
        })
        .then(done).catch(done);

        subject.stream.readyPromise.then(function() {
          collectors.events({
            'type': 'foo'
          });
          collectors.settings({
            'settingName': 'barname',
            'settingValue': 'barvalue'
          });
          subject.stream.close();
        });
    });
  });

  suite('state transferring', function() {
    test('would receive state transferring', function(done) {
      var hasStateTransferring = false;
      subject
        .setup()
        .reduce(function(acc, newval) {
          if (newval.fromState && newval.fromState.type === 'fromState' &&
              newval.toState && newval.toState.type === 'toState') {
            hasStateTransferring = true;
          }
        })
        .then(function() {
          assert.isTrue(hasStateTransferring,
            'did\'t receive state transferring as element of the stream');
        })
        .then(done).catch(done);

        subject.stream.readyPromise.then(function() {
          subject.emitter = subject.stream.notify.bind(subject.stream);
          subject.transfer({
            'type': 'fromState'
          }, {
            'type': 'toState'
          });
        subject.stream.close();
        });
    });
  });
});
