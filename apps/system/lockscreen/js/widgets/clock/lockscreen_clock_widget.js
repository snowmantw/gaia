/* global LockScreenBasicComponent, LockScreenClockWidgetSetup */
'use strict';

/**
 * The Clock widget on LockScreen.
 * Clock widget states:
 * ClockSetup, ClockTick, ClockStop
 **/
(function(exports) {
  var LockScreenClockWidget = function() {
    LockScreenBasicComponent.apply(this);
    this.resources.elements.time = 'lockscreen-clock-time';
    this.resources.elements.date = 'lockscreen-date';
    this._timeFormat = null;
  };
  LockScreenClockWidget.prototype =
    Object.create(LockScreenBasicComponent.prototype);

  LockScreenClockWidget.prototype.setup = function() {
    return (new LockScreenClockWidgetSetup(this));
  };

  LockScreenClockWidget.prototype.updateClock =
  function() {
    console.log('>> updateClock called');
    var now = new Date();
    var f = new navigator.mozL10n.DateTimeFormat();
    var _ = navigator.mozL10n.get;

    var timeFormat = this._timeFormat.replace('%p', '<span>%p</span>');
    var dateFormat = _('longDateFormat');

    var timeHTML = f.localeFormat(now, timeFormat);
    var dateText = f.localeFormat(now, dateFormat);

    this.resources.elements.time.innerHTML = timeHTML;
    this.resources.elements.date.textContent = dateText;
  };

  LockScreenClockWidget.prototype.getTimeformat = function() {
    return window.navigator.mozHour12 ?
      navigator.mozL10n.get('shortTimeFormat12') :
      navigator.mozL10n.get('shortTimeFormat24');
  };

  exports.LockScreenClockWidget = LockScreenClockWidget;
})(window);

