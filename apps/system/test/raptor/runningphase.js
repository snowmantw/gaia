'use strict';
/* globals require */

// Because external requiring will mess up dependencies and paths.
var pth = require('path');
var _req = require;
var raptorPath = pth.dirname(require.main.filename) + pth.sep + '..' + pth.sep;
var raptorNodePath = raptorPath + pth.sep + 'node_modules' + pth.sep;

// The workaround is to find out where the Raptor is, and then to find packages
// from that. However, there are some exceptions need to be dealt with.
require = function(path) {
  // Raptor + '/' + path
  try {
    return _req(raptorPath + pth.sep + path); // relative
  } catch(e1) {
  try {
    return _req(raptorNodePath + pth.sep + path); // Package/node_modules
  } catch(e2) {
    return _req(path);    // Native
  }}
};

var Phase = require('lib/phases/phase');
var Dispatcher = require('lib/dispatcher');
var Promise = require('promise');
var util = require('util');
var performanceParser = require('lib/parsers/performance');
var debug = require('debug')('raptor:running');

var Running = function(options) {
  if (!options.frame || !options.frame.begin || !options.frame.end) {
    throw new Error('Device running session needs one pair of begin and end');
  }
  if (!options.actions) {
    throw new Error('Need an action chain to perform.');
  }
  this.actions = options.actions;

  this.beginMark = options.frame.begin;
  this.endMark = options.frame.end;

  options.preventDispatching = true;

  Phase.call(this, options);
  this.start();
};

util.inherits(Running, Phase);

Running.prototype.title = 'Running';
Running.prototype.name = 'running';

Running.prototype.setup = function() {
  var Defer = function() {
    this.promise = new Promise((function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }).bind(this));
  };
  this.waitEndMarkReached = new Defer();
  this.device.log.restart();
  this.dispatcher = new Dispatcher(this.device);
  this.registerParser(performanceParser);
  this.capture();
};

Running.prototype.reboot = function() {
  var phase = this;

  this.beginMarkReached = false;
  this.endMarkReached = false;

  return this.getDevice()
    .then(function() {
      return phase.device.log.clear();
    })
    .then(function() {
      phase.start = Date.now();
      return phase.restart();
    })
    .then(function(time) {
      phase.setup();    // capture starts in this step
    })
    .then(function() {
      return phase.device
        .adbForward(phase.options.forwardPort || phase.options.marionettePort);
    });
};

Running.prototype.performActions = function() {
  return this.actions(this);
};

Running.prototype.restart = function() {
  return this.device.helpers.reboot();
};

Running.prototype.capture = function() {

  var phase = this;
  var entryPoint = this.options.entryPoint;

  var handler = (function(entry) {
    var name = entry.name;
    var entryOut = entry;

    if (entry.entryType === 'mark' && entry.name === this.beginMark) {
      this.beginMarkReached = true;
    }

    var ignore =
        entry.entryType !== 'mark' ||
        !this.beginMarkReached ||
        this.endMarkReached;

    // Due to a bug in a device's ability to keep consistent time after
    // a reboot, we are currently overriding the time of entries. Not
    // very accurate, but it's better than nothing. :/
    //entryOut.epoch = name === this.beginMark ? phase.start : Date.now();
    //
    // Unfortunately, in running phase doing this adjustment will make the
    // difference between two marks **very inaccurate**. So we can't keep this
    // trick.

    phase.debugEventEntry(Phase.PERFORMANCEENTRY, entryOut);

    if (ignore) {
      return;
    }

    if (entry.name === this.endMark) {
      this.endMarkReached = true;
    }

    if (entryPoint) {
      entryOut.entryPoint = entryPoint;
    }

    // Duplicate it to let measure can have a placeholder to show in the table.
    // Since the first one will be ignore in the original flow, and it will not show
    // the base mark in the report.
    if (entry.name === this.beginMark) {
      this.results.push(entryOut);
    }
    this.results.push(entryOut);
    if (entry.name === this.endMark) {
      this.dispatcher.removeListener(Phase.PERFORMANCEENTRY, handler);
      this.waitEndMarkReached.resolve();
    }
  }).bind(this);
  this.dispatcher.on(Phase.PERFORMANCEENTRY, handler);
};

Running.prototype.testRun = function() {
  var phase = this;

  return this
    .reboot()
    .then(function() {
      return phase.waitForB2GStart();
    })
    .then(function() {
      // To perform the specified action and capturing the logs.
      return phase.performActions();
    })
    .then(function() {
      return phase.waitEndMarkReached.promise;
    });
};


Running.prototype.retry = Phase.NOOP;

Running.prototype.handleRun = function() {
  this.report(this.format(this.results, this.beginMark));
  return Promise.resolve();
};

module.exports = Running;
