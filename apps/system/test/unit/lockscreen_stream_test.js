'use strict';

/* global LockScreenStream */

requireApp('system/lockscreen/js/stream/basic_stream.js');
requireApp('system/lockscreen/js/stream/stream.js');
requireApp('system/lockscreen/js/lockscreen_stream.js');
suite('system/LockScreen/LockScreenStream >', function() {
  var instance;
  var subject;
  var collectors;
  setup(function() {
    delete LockScreenStream.instance;
    collectors = {
      events: null,
      settings: null,
      bridge: null
    };
    window.Source = {
      events: function() {
        return {
          collector: function(collector) {
            collectors.events = collector;
         }
        };
      },
      settings: function() {
        return {
          collector: function(collector) {
            collectors.settings = collector;
          }
        };
      },
      bridge: function(outsource) {
        outsource.emitter((item) => {
          subject.notify(item);
        });
      }
    };
    instance = new LockScreenStream();
    // Get the stream 'instance'.
    subject = instance.instance();
  });

  suite('instance and stream source works', function() {
    var mockEvent = {
      'type': 'foo'
    };
    var mockSettingChange = {
      'settingName': 'barName',
      'settingValue': 'barValue'
    };
    var mockStateFrom = {
      'type': 'fromState'
    };
    var mockStateTo = {
      'type': 'toState'
    };
    test('event & setting changes', function(done) {
      var gotevent = false;
      var gotsettingchange = false;
      subject.reduce(function(acc, newval) {
        if (newval.type && 'foo' === newval.type) {
          gotevent = true;
        } else if (
          'barName' === newval.settingName &&
          'barValue' === newval.settingValue) {
          gotsettingchange = true;
        }
      }).then(function() {
        assert.isTrue(gotevent,
          'no event from event source');
        assert.isTrue(gotsettingchange,
          'no setting change from setting source');
      })
      .then(done)
      .catch(done);

      collectors.events(mockEvent);
      collectors.settings(mockSettingChange);
      // Need to close the stream to end the reducing.
      subject.close();
    });

    test('from the transfer method', function(done) {
      var gottransferring = false;
      subject.reduce(function(acc, newval) {
        if ('fromState' === newval.from.type &&
            'toState' === newval.to.type) {
          gottransferring = true;
        }
      }).then(function() {
        assert.isTrue(gottransferring,
          'no event from event source');
      })
      .then(done)
      .catch(done);
    console.log('|| << >> ', typeof instance.emitter);
      instance.transfer(mockStateFrom, mockStateTo);
      // Need to close the stream to end the reducing.
      subject.close();
    });
  });
});
