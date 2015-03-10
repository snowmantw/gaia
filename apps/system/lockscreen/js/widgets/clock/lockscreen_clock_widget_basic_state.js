/* global LockScreenBasicState */
/* global LockScreenClockWidgetResourceKeeper */
'use strict';

/**
 * The basic state of the clock widget.
 *
 * Feel it's too orthogonal? Unfortunately to prevent method copying and
 * other duplicated works we need to implemenet things like this. Since every
 * state should know it's resource keeper of the certain widget, also get
 * all functions provided by the basic state.
 **/
(function(exports) {
  var LockScreenClockWidgetBasicState = function(component) {
    LockScreenClockWidgetResourceKeeper.apply(this, arguments);
    LockScreenBasicState.apply(this, arguments);
  };
  LockScreenClockWidgetBasicState.prototype =
    Object.create(LockScreenBasicState.prototype);
  LockScreenClockWidgetBasicState.prototype =
    Object.create(LockScreenClockWidgetResourceKeeper);
  exports.LockScreenClockWidgetBasicState = LockScreenClockWidgetBasicState;
})(window);

