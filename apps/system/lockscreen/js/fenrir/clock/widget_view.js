/* global Process */
'use strict';

/**
 * Render the clock widget.
 * It's a simple UI view.
 **/
(function(exports) {
  var LockScreenClockWidgetView = function() {};
  LockScreenClockWidgetView.prototype.render = function(props, target) {
    return (new Process()).start().next(() => {
      var { timeFormat, now } = props;
      var f = new navigator.mozL10n.DateTimeFormat();
      var _ = navigator.mozL10n.get;

      var domTimeFormat = timeFormat.replace('%p', '<span>%p</span>');
      var dateFormat = _('longDateFormat');

      var timeHTML = f.localeFormat(now, domTimeFormat);
      var dateText = f.localeFormat(now, dateFormat);

      target.time.innerHTML = timeHTML;
      target.date.textContent = dateText;
    });
  };
  exports.LockScreenClockWidgetView = LockScreenClockWidgetView;
})(window);

