'use strict';

var UtilityTray = require(__dirname + '/../../marionette/lib/utility_tray');

/**
 * To show a complete independent mark insertion that change no Gaia code.
 */
var actions = function(phase) {
  return phase.device.marionette
    .startSession()
    .then(function(client) {
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
      var Loader = require(__dirname +
        '/../../../../../shared/test/integration/marionette_loader.js');
      client.loader = new Loader(client);
      var sys = getAppClass('system');
      var utilityTray = new UtilityTray(client);
      var buttonSelector = '#quick-settings-bluetooth';
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
      sys.waitForFullyLoaded();
      client.switchToFrame();
      utilityTray.swipeDown();
      utilityTray.waitForOpened();
      client.executeScript(function() {
if (!window.wrappedJSObject.performance) {
  throw new Error('>>>> NO WRAPPED PERFORMANCE');
}
        window.wrappedJSObject.performance.mark('beforeButtonToggled');
      });
      client.findElement(buttonSelector).tap();
      client.waitFor(function() {
        return null !== window.wrappedJSObject.document
          .querySelector('#quick-settings-bluetooth[data-enabled]');
      });

      client.executeScript(function() {
if (!window.wrappedJSObject.performance) {
  throw new Error('>>>> NO WRAPPED PERFORMANCE');
}
        window.wrappedJSObject.performance.mark('afterButtonToggled');
      });
      deferred.resolve();
      return deferred.promise;
  });
};

/* global setup, afterEach, marionetteScriptFinished */
/* Test from lock to unlock, how long does it take. */
setup(function(options) {
  options.phase = process.env.RUNNING_PHASE;
  options.frame = {
    'begin': 'beforeButtonToggled',
    'end': 'afterButtonToggled'
  };
  options.test = 'button-toggle';
  options.actions = actions;
});

