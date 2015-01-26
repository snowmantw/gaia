/* global Stream, DOMEventSource */
/* global LockScreenBasicState */
/* global LockScreenClockWidgetTick, LockScreenClockWidgetSuspend */
'use strict';

/***/
(function(exports) {
  var LockScreenClockWidgetDelayLastSeconds = function(component) {
    console.log('>> >> component in DLS: ', component);
    LockScreenBasicState.apply(this, arguments);
    this.configs.name = 'LockScreenClockWidgetDelayLastSeconds';
    this.configs.stream.interrupts = [
      'screenchange',
    ];
    this.configs.stream.sources =
      [new DOMEventSource({events: ['screenchange']})];
    this.handleEvent = this.handleEvent.bind(this);
  };
  LockScreenClockWidgetDelayLastSeconds.prototype =
    Object.create(LockScreenBasicState.prototype);

  LockScreenClockWidgetDelayLastSeconds.prototype.start = function() {
    console.log('>> LockScreenClockWidgetDelayLastSeconds start');
    this.stream = new Stream(this.configs.stream);
    return this.stream.start(this.handleEvent)
      .next(this.stream.ready.bind(this.stream))
      .next(this.waitLastSeconds.bind(this))
      .next(this.transferToTick.bind(this));
  };

  LockScreenClockWidgetDelayLastSeconds.prototype.stop =
  function() {
    console.log('>> LockScreenClockWidgetDelayLastSeconds stop');
    return LockScreenBasicState.prototype.stop.call(this);
  };

  // This is necessary. Since we need to wait the last seconds
  // in the current minute to bootstrap the timer.
  LockScreenClockWidgetDelayLastSeconds.prototype.waitLastSeconds =
  function() {
    return new Promise((resolve) => {
      console.log('>> >> >> now delay');
      // Which second in this minute we're.
      var seconds = (new Date()).getSeconds();
      var leftSeconds = 60 - seconds;
      window.setTimeout(() => {
        resolve();
      }, leftSeconds * 1000);
    });
  };

  LockScreenClockWidgetDelayLastSeconds.prototype.handleEvent =
  function(evt) {
    switch (evt.type) {
      case 'screenchange':
        console.log('>> >> >> >> >> >> >> >> receive');
        if (!evt.detail.screenEnabled) {
          return this.transferToSuspend();
        }
    }
  };

  LockScreenClockWidgetDelayLastSeconds.prototype.transferToSuspend =
  function() {
    console.log('>> transferToSuspend called;');
    this.transferTo(LockScreenClockWidgetSuspend);
  };

  LockScreenClockWidgetDelayLastSeconds.prototype.transferToTick =
  function() {
    console.log('>> transferToTick called;');
    this.transferTo(LockScreenClockWidgetTick);
  };

  exports.LockScreenClockWidgetDelayLastSeconds =
    LockScreenClockWidgetDelayLastSeconds;
})(window);

