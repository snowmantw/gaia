'use strict';

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
      sys.waitForFullyLoaded();
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
      client.switchToFrame();
      // --- if not enabled ---
      var enabled = client.executeAsyncScript(function() {
        var settings = window.wrappedJSObject.navigator.mozSettings;
        var lock = settings.createLock();
        lock.get('lockscreen.enabled').then(function(val) {
          marionetteScriptFinished(val['lockscreen.enabled'], 'success');
        }).catch(function(err) {
          marionetteScriptFinished(err, 'falied');
        });
      });

      // ---- enable it ----
      if (!enabled) {
        client.executeAsyncScript(function() {
          var settings = window.wrappedJSObject.navigator.mozSettings;
          var lock = settings.createLock();
          lock.set({
            'lockscreen.enabled': true
          }).then(function() {
            marionetteScriptFinished(null, 'success');
          }).catch(function(err) {
            marionetteScriptFinished(err, 'falied');
          });
        });
      }

      // ---- start the test ----
      client.executeScript(function() {
        window.wrappedJSObject.Service.request('lock');
      });
      client.waitFor(function() {
        return client.executeScript(function() {
          return window.wrappedJSObject.Service.query('locked');
        });
      });
      client.executeScript(function() {
        window.wrappedJSObject.Service.request('unlock');
      });
      client.waitFor(function() {
        return client.executeScript(function() {
          return !window.wrappedJSObject.Service.query('locked');
        });
      });
      // ---- end the test ----

      // ---- reset to not enabled ----
      client.executeAsyncScript(function() {
        var settings = window.wrappedJSObject.navigator.mozSettings;
        var lock = settings.createLock();
        lock.set({
          'lockscreen.enabled': false
        }).then(function() {
          marionetteScriptFinished(null, 'success');
        }).catch(function(err) {
          marionetteScriptFinished(err, 'falied');
        });
      }, function(err) {
        if (err) {
          deferred.reject(err);
        }
        deferred.resolve();
      });
      return deferred.promise;
  });
};

/* global setup, afterEach, marionetteScriptFinished */
/* Test from lock to unlock, how long does it take. */
setup(function(options) {
  options.phase = process.env.RUNNING_PHASE;
  options.frame = {
    'begin': 'lockScreenLock',
    'end': 'lockScreenUnlock'
  };
  options.test = 'unlock-lock';
  options.actions = actions;
});


