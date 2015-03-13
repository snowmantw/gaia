/* global LockScreenBasicComponent, LockScreenClockWidgetSetup */
'use strict';

/**
 * The Clock widget on LockScreen.
 * Clock widget states:
 * ClockSetup, ClockTick, ClockStop
 **/
(function(exports) {
  var LockScreenClockWidget = function(view) {
    LockScreenBasicComponent.apply(this, arguments);
    this.resources.elements.time = 'lockscreen-clock-time';
    this.resources.elements.date = 'lockscreen-date';
    this._timeFormat = null;
    this.configs.logger.debug = false;  // turn on this when we're debugging
  };
  LockScreenClockWidget.prototype =
    Object.create(LockScreenBasicComponent.prototype);

  LockScreenClockWidget.prototype.setup = function() {
    return (new LockScreenClockWidgetSetup(this));
  };

  LockScreenClockWidget.prototype.updateClock =
  function() {
    var now = new Date();
    this.render({
      'now': now,
      'timeFormat': this._timeFormat
    }, this.resources.elements)
    .next(() => {
      this.logger.debug('Clock update', now);
    });
  };

  LockScreenClockWidget.prototype.getTimeformat = function() {
    return window.navigator.mozHour12 ?
      navigator.mozL10n.get('shortTimeFormat12') :
      navigator.mozL10n.get('shortTimeFormat24');
  };

  exports.LockScreenClockWidget = LockScreenClockWidget;
})(window);

