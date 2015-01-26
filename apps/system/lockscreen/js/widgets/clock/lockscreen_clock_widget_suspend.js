/* global Stream, DOMEventSource */
/* global LockScreenClockWidgetDelayLastSeconds, LockScreenBasicState */
'use strict';

/***/
(function(exports) {
  var LockScreenClockWidgetSuspend = function(component) {
    LockScreenBasicState.apply(this, arguments);
    this.configs.name = 'LockScreenClockWidgetSuspend';
    this.configs.stream.interrupts = [
      'screenchange',
    ];
    this.configs.stream.sources =
      [new DOMEventSource({events: ['screenchange']})];
    this.handleEvent = this.handleEvent.bind(this);
  };
  LockScreenClockWidgetSuspend.prototype =
    Object.create(LockScreenBasicState.prototype);

  LockScreenClockWidgetSuspend.prototype.start = function() {
    console.log('>> LockScreenClockWidgetSuspend start');
    this.stream = new Stream(this.configs.stream);
    return this.stream.start(this.handleEvent)
      .next(this.stream.ready.bind(this.stream));
  };

  LockScreenClockWidgetSuspend.prototype.stop =
  function() {
    console.log('>> LockScreenClockWidgetSuspend stop');
    return LockScreenBasicState.prototype.stop.call(this);
  };

  LockScreenClockWidgetSuspend.prototype.handleEvent =
  function(evt) {
    switch (evt.type) {
      case 'screenchange':
        if (evt.detail.screenEnabled) {
          return this.transferToDelayLastSeconds();
        }
    }
  };

  LockScreenClockWidgetSuspend.prototype.transferToDelayLastSeconds =
  function() {
    console.log('>> transferToDelayLastSeconds called;');
    this.component.transferTo(LockScreenClockWidgetDelayLastSeconds);
  };

  exports.LockScreenClockWidgetSuspend = LockScreenClockWidgetSuspend;
})(window);

