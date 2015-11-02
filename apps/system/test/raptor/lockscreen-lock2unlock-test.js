'use strict';

/* global setup, afterEach, marionetteScriptFinished */
/* Test from lock to unlock, how long does it take. */
setup(function(options) {
  options.phase = 'reboot';
/*
  options.frame = {
    'begin': 'lockScreenLock',
    'end': 'lockScreenUnlock'
  };
*/
  options.test = 'unlock-lock';
});

afterEach(function(phase) {
console.log('>>>>> actions called');
  return phase.device.marionette
    .startSession()
    .then(function(client) {
      var Deferred = function() {
        this.promise = new Promise((function(res, rej) {
          this.resolve = res;
          this.reject = rej;
        }).bind(this));
        return this;
      };
      var deferred = new Deferred();
      deferred.promise = deferred.promise.then(function() {
console.log('>>>>>>> in the second step of deferred');
        client.deleteSession();
      }).catch(function(err) {
        console.error(err);
        throw err;
      });
console.log('>>>>> in the actions');
      client.switchToFrame();
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
console.log('>>>>>>> resolve the deferred');
        deferred.resolve();
      });
      return deferred.promise;
  });
});
