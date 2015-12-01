'use strict';

/* globals require, module, Performance */

module.exports = function(filepath, outpath, requiredir) {
  // Developer can write their super fancy filter here.
  if (!filepath.match(/\/input_window_manager.js$/)) {
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
    .select(filepath + ' InputWindowManager.prototype.showInputWindow')
    .before(function() {
      performance.mark('keyboardRisingStart');
    })
    .done()
    .select(filepath + ' InputWindowManager.prototype.hideInputWindow')
    .before(function() {
      performance.mark('keyboardHiddingStart');
    })
    .done()
    .select(filepath + ' InputWindowManager.prototype.handleEvent')
    .before(function(evt) {
      if ('input-appclosed' === evt.type) {
        // Now collect the metrics from 'lockScreenLock' to here.
        performance.mark('keyboardHiddingEnd');
      } else if ('input-appopened' === evt.type) {
        performance.mark('keyboardRisingEnd');
      }
    })
    .done()
  .done();
  // If it matched nothing as it was supposed to do, we have a bug.
  if (!logger._writelogs[filepath]) {
    throw new Error('TransformingFailed::Matched nothing to transform code.');
  } else {
    Object.keys(logger._writelogs).forEach(function(filepath) {
      var info = logger._writelogs[filepath];
      console.log('|calendar-rising2hdding.esp| Successfully wove ', filepath);
    });
  }
};
