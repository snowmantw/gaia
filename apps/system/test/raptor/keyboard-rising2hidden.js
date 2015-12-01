'use strict';

var SETTINGS_APP = 'app://settings.gaiamobile.org';
var CALENDAR_APP = 'app://calendar.gaiamobile.org';

var actions = function(phase) {
  return phase.device.marionette
    .startSession()
    .then(function(client) {
      var OnlyInputText = require(__dirname +
        '/../../../test/marionette/lib/onlyinputtext.js');
      var onlyinputtext = new OnlyInputText(client);
      var apps = {};

      apps[onlyinputtext.origin] = onlyinputtext.path;
      // Reset with a different profile.
      client.resetWithDriver(client.driver, {
        profile: { apps: apps }
      });
      var Mgmt = require(__dirname +
        '/../../../../../tests/jsmarionette/plugins/marionette-apps/lib/mgmt.js');
      var mgmt = new Mgmt(client);
      mgmt.prepareClient();
      var getAppClass = function(app, region) {
        region = region || app;
        var AppClass = require(
        __dirname + '/../../../../' + app + '/test/marionette/lib/' + region);
        return new AppClass(client);
      }

      var Deferred = function() {
        this.promise = new Promise((function(res, rej) {
          this.resolve = res;
          this.reject = rej;
        }).bind(this));
        return this;
      };
      var deferred = new Deferred();
      deferred.promise = deferred.promise.then(function() {
        client.deleteSession();
      }).catch(function(err) {
        console.error(err);
        throw err;
      });

      var sys;
      var calendar;
      var quarterWidth, topHalf;

      var setup = function() {
console.log('>>>>> setup 1');
        var Loader = require(__dirname +
          '/../../../../../shared/test/integration/marionette_loader.js');
        client.loader = new Loader(client);
console.log('>>>>> setup 2');
        //client.apps.mgmt.prepareClient();
        sys = getAppClass('system');
console.log('>>>>> setup 3');
        onlyinputtext.launchInBackground()
console.log('>>>>> setup 4');
      };
cosole.log('>>>>> before setup');
      setup();
cosole.log('>>>>> after setup');
      // Focusing the keyboard in the calendar app
      onlyinputtext.runInApp(function() {
        var input = window.wrappedJSObject.document.querySelector('#theinput');
        if (!input) { throw new Error('No input element!'); }
        input.addEventListener('click', function() {
          performance.mark('keyboardRisingStart');
        });
      });
      onlyinputtext.theInputElement.tap();
      client.switchToFrame();
      sys.waitForKeyboard();
      deferred.resolve();
      return deferred.promise;
  });
};

/* global setup, afterEach, marionetteScriptFinished */
setup(function(options) {
  options.phase = process.env.RUNNING_PHASE;
  options.frame = {
    'begin': 'keyboardRisingStart',
    'end': 'keyboardRisingEnd'
  };
  options.test = 'rise-api-time';
  options.actions = actions;
});

