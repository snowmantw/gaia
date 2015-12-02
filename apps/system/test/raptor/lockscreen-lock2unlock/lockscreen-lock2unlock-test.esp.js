'use strict';

/* globals require, module, Performance */

module.exports = function(filepath, outpath, requiredir) {
  // Developer can write their super fancy filter here.
  if (!filepath.match(/lockscreen.js$/) &&
      !filepath.match(/lock_screen_window_manager.js$/)) {
    return;
  }
  var Logger = function() {
    this._writelogs = {};
  };
  Logger.prototype.log = function(outpath, advice) {
    this._writelogs[filepath] = {
      'outpath': outpath,
      'file': advice.file,
      'query': advice.query
    };
  };
  var logger = new Logger();
  var opts = {};
  if (outpath) {
    var fs = require('fs');
    opts.writer = {
      write: function(advice) {
        if (advice.instance.applied) {
          logger.log(filepath, advice);
        }
        var code = advice.code;
        fs.writeFile(outpath, code);
      }
    };
  }
  var Espect;
  try {
    Espect = require('espect.js');
  } catch(e) {
    Espect = require(requiredir + 'espect.js');
  }
  var espect = new Espect(opts);
  espect
    .select(filepath + ' LockScreen.prototype.lock')
    .before(function() {
console.log('>>>> lockScreenLock mark');
      performance.mark('lockScreenLock');
    })
    .done()
    .select(filepath + ' LockScreenWindowManager.prototype.responseUnlock')
    .before(function() {
console.log('>>>> lockScreenUnlock mark');
      // Now collect the metrics from 'lockScreenLock' to here.
      performance.mark('lockScreenUnlock');
    })
    .done()
  .done();
  // If it matched nothing as it was supposed to do, we have a bug.
  if (!logger._writelogs[filepath]) {
    throw new Error('TransformingFailed::Matched nothing to transform code.');
  } else {
    Object.keys(logger._writelogs).forEach(function(filepath) {
      var info = logger._writelogs[filepath];
      console.log('|lock2unlock.esp| Successfully wove ', filepath);
    });
  }
};