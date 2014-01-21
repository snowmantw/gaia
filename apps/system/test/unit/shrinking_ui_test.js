'use strict';

mocha.globals(['removeEventListener', 'addEventListener',
      'LockScreen', 'OrientationManager', 'BrowserFrame',
      'navigator', 'dispatchEvent', 'AppWindow', 'ShrinkingUI']);

requireApp('system/test/unit/mock_orientation_manager.js');
requireApp('system/test/unit/mock_app_window.js');

var mocksForAppWindowManager = new MocksHelper([
  'OrientationManager', 'AppWindow'
]).init();

suite('system/AppWindowManager', function() {
  mocksForAppWindowManager.attachTestHelpers();
  var stubById;
  var app;
  var fakeAppConfig = {
    url: 'app://www.fake/index.html',
    manifest: {},
    manifestURL: 'app://wwww.fake/ManifestURL',
    origin: 'app://www.fake'
  };
  setup(function(done) {
    navigator.mozL10n = {get: function(name) {
      return 'mock L10n';
    }};
    stubById = this.sinon.stub(document, 'getElementById');
    stubById.returns(document.createElement('div'));
    app = new AppWindow(fakeAppConfig);
    var wrapper = document.createElement('div');
    app.frame = document.createElement('ifraame');
    wrapper.appendChild(app.frame);
    requireApp('system/js/shrinking_ui.js', function() {
      ShrinkingUI.apps[app.origin] = app;
      done();
    });
  });

  teardown(function() {
    stubById.restore();
  });

  suite('Events', function() {
    test('commands queue: left 1 start event', function() {
      ShrinkingUI.handleEvent({type: 'appcreated', detail: app});
      ShrinkingUI.handleEvent({type: 'appopen', detail: fakeAppConfig});

      ['shrinking-start', 'shrinking-stop', 'shrinking-start',
       'shrinking-stop', 'shrinking-start'].forEach(function(ename) {
        ShrinkingUI.handleEvent(new CustomEvent(ename));
       });
      assert.equal(ShrinkingUI._accQueuedState(), 1,
        'the commands queue didn\'t accumulate correctly');
    });
  });
});
