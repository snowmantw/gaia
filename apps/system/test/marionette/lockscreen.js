'use strict';
var util = require('util'),
    Marionette = require('marionette-client');

function LockScreenTest(client, origin) {
  this.client = client;
  this.origin = origin;
}

function FTU(client, origin) {
  this.client = client;
  this.origin = origin;
}

function Wait(client) {
  this.client = client;
}

module.exports = {'LockScreenTest': LockScreenTest,
                  'FTU': FTU,
                  'Wait': Wait};

Wait.prototype = {
  sec: function(num) {
    (new Marionette.Actions(this.client)).wait(num).perform();
  }
};

FTU.prototype = {
  skip: function() {
    this.client.executeScript(function() {
      window.wrappedJSObject.FtuLauncher.skip();
    }, []);
  }
};

LockScreenTest.prototype = {
  client: null,
  origin: null,

  lock: function() {
    this.client.executeScript(function() {
      return window.wrappedJSObject.LockScreen.lock();
    }, []);
  },

  get locked() {
    return this.sliderRight.displayed() &&
           this.panel.displayed() &&
           this.client.executeScript(function() {
             return window.wrappedJSObject.LockScreen.locked;
           }, []);
  },

  get sliderRight() {
    return this.client.executeScript(function() {
      return window.wrappedJSObject.LockScreen.sliderRight;
    }, []);
  },

  get sliderLeft() {
    return this.client.executeScript(function() {
      return window.wrappedJSObject.LockScreen.sliderLeft;
    }, []);
  },

  get panel() {
    return this.client.findElement('#lockscreen', 'css selector');
  }
};
