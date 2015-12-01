'use strict';

var Messages = require('../../../sms/test/marionette/lib/messages.js');
var SETTINGS_APP = 'app://settings.gaiamobile.org';
var CALENDAR_APP = 'app://calendar.gaiamobile.org';

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
      var calendar;
      var quarterWidth, topHalf;

      var setup = function() {
        var Loader = require(__dirname +
          '/../../../../shared/test/integration/marionette_loader.js');
        client.loader = new Loader(client);
        //client.apps.mgmt.prepareClient();
        sys = getAppClass('system');
        //sys.waitForStartup();
        calendar = sys.waitForLaunch(CALENDAR_APP);

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
      // Focusing the keyboard in the calendar app
      client.switchToFrame(calendar);
      client.findElement('a[href="/event/add/"').tap();
      client.findElement('input[name="title"]').tap();
      var initialHeight = client.executeScript(function() {
        return window.wrappedJSObject.innerHeight;
      });
      client.switchToFrame();
      sys.waitForKeyboard();
      client.switchToFrame(calendar);
      client.findElement('#modify-event-header button.save').tap();
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

