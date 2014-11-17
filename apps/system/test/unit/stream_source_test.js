 /* global StreamSource */
'use strict';

requireApp('system/lockscreen/js/stream/stream_source.js');

suite('StreamSource', function() {
  var originalMozSettings;
  setup(function() {
    originalMozSettings = window.navigator.mozSettings;
    window.navigator.mozSettings = {
      addObserver: function() {},
      removeObserver: function() {}
    };
  });

  teardown(function() {
    window.navigator.mozSettings = originalMozSettings;
  });

  test('Can execute the code only when conditions satisfied', function(done) {
    var source = (new StreamSource({
        'fooProp': 1,
        'barProp': 2
      }))
      .events(new Set(['fooEvent', 'barEvent']))
      .settings(new Set(['fooSetting', 'barSetting']))
      .properties(new Set(['fooProp', 'barProp']));

    source.ready()
      .then(function(inputs) {
        assert.equal(inputs.events[0].type, 'fooEvent');
        assert.equal(inputs.events[1].type, 'barEvent');
        assert.equal(inputs.settings[0].settingName, 'fooSetting');
        assert.equal(inputs.settings[1].settingName, 'barSetting');
        assert.equal(inputs.properties.fooProp, 1);
        assert.equal(inputs.properties.barProp, 2);
      })
      .then(done)
      .catch(done);

    source.handleEvent({ type: 'fooEvent' });
    source.handleEvent({ type: 'barEvent' });
    source.handleSetting({ settingName: 'fooSetting' });
    source.handleSetting({ settingName: 'barSetting' });
    source.close();
  });
});
