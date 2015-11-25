'use strict';

var Messages = require('../../../sms/test/marionette/lib/messages.js');
var SETTINGS_APP = 'app://settings.gaiamobile.org';
var SMS_APP = 'app://sms.gaiamobile.org';

var actions = function(phase) {
  return phase.device.marionette
    .startSession()
    .then(function(client) {
      var Mgmt = require(__dirname +
        '/../../../../tests/jsmarionette/plugins/marionette-apps/lib/mgmt.js');
      var mgmt = new Mgmt(client);
      mgmt.prepareClient();
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
        var Loader = require(__dirname +
          '/../../../../shared/test/integration/marionette_loader.js');
        client.loader = new Loader(client);
        console.error('>>>>>> client.apps: ', typeof client.apps)
        //client.apps.mgmt.prepareClient();
console.error('>>>>> setup 1');
        sys = getAppClass('system');
        //sys.waitForStartup();
console.error('>>>>> setup 2');
        settings = sys.waitForLaunch(SETTINGS_APP);
console.error('>>>>> setup 3');
        sms = sys.waitForLaunch(SMS_APP);
console.error('>>>>> setup 4');

        smsLib = Messages.create(client);
console.error('>>>>> setup 5');

        // Making sure the opening transition for the sms app is over.
        client.waitFor(function() {
          return sms.displayed() && !settings.displayed();
        });
console.error('>>>>> setup 6');

        var width = client.executeScript(function() {
          return window.innerWidth;
        });
console.error('>>>>> setup 7');
        quarterWidth = width / 4;
console.error('>>>>> setup 8');

        var height = client.executeScript(function() {
          return window.innerHeight;
        });
console.error('>>>>> setup 9');
        topHalf = height / 2 - 100;
      };
console.error('>>>>> setup');
      setup();
console.error('>>>>> setup done');

console.error('>>>>> switchframe (sms)');
      // Focusing the keyboard in the sms app
      client.switchToFrame(sms);
console.error('>>>>> switchframe (sms) done');
console.error('>>>>> initialHeight');
      var initialHeight = client.executeScript(function() {
        return window.wrappedJSObject.innerHeight;
      });
console.error('>>>>> initialHeight done');
console.error('>>>>> navigateToComposer');
      smsLib.Inbox.navigateToComposer();
console.error('>>>>> navigateToComposer done');
console.error('>>>>> top()');
      var composer = smsLib.Composer;
      composer.messageInput.tap();
console.error('>>>>> top() done');

console.error('>>>>> switchToFrame ');
      client.switchToFrame();
console.error('>>>>> switchToFrame done');
console.error('>>>>> waitForKeyboard');
      sys.waitForKeyboard();
console.error('>>>>> waitForKeyboard done');

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

