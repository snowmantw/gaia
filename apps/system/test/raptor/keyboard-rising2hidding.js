'use strict';

var Messages = require('../../../sms/test/marionette/lib/messages.js');
var SETTINGS_APP = 'app://settings.gaiamobile.org';
var SMS_APP = 'app://sms.gaiamobile.org';


var actions = function(phase) {
  return phase.device.marionette
    .startSession()
    .then(function(client) {

/*
TODO: how to insert this into the pre-set client?

      var client = marionette.client({
        profile: {
          prefs: {
            'focusmanager.testmode': true
          }
        }
      });
*/

      var getAppClass = function(app, region) {
        region = region || app;
        var AppClass = require(
        __dirname + '/../../../' + app + '/test/marionette/lib/' + region);
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
      var settings, sms, smsLib;
      var quarterWidth, topHalf;

      var setup = function() {
        sys = getAppClass('system');
        //sys.waitForStartup();
        settings = sys.waitForLaunch(SETTINGS_APP);
        sms = sys.waitForLaunch(SMS_APP);

        smsLib = Messages.create(client);

        // Making sure the opening transition for the sms app is over.
        client.waitFor(function() {
          return sms.displayed() && !settings.displayed();
        });

        var width = client.executeScript(function() {
          return window.innerWidth;
        });
        quarterWidth = width / 4;

        var height = client.executeScript(function() {
          return window.innerHeight;
        });
        topHalf = height / 2 - 100;
      };
      setup();

      // Focusing the keyboard in the sms app
      client.switchToFrame(sms);
      var initialHeight = client.executeScript(function() {
        return window.wrappedJSObject.innerHeight;
      });
      smsLib.Inbox.navigateToComposer();
      var composer = smsLib.Composer;
      composer.messageInput.tap();

      client.switchToFrame();
      sys.waitForKeyboard();

      deferred.resolve();
      return deferred.promise;
  });
};

/* global setup, afterEach, marionetteScriptFinished */
/* Test from lock to unlock, how long does it take. */
setup(function(options) {
  options.phase = process.env.RUNNING_PHASE;
  options.frame = {
    'begin': 'keyboardRisingStart',
    'end': 'keyboardHiddingEnd'
  };
  options.test = 'rise-hide';
  options.actions = actions;
});

