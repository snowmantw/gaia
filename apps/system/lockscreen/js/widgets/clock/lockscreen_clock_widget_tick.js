/* global Stream, DOMEventSource, MinuteClockSource */
/* global LockScreenClockWidgetSuspend, LockScreenBasicState */
'use strict';

/***/
(function(exports) {
  var LockScreenClockWidgetTick = function(component) {
    LockScreenBasicState.apply(this, arguments);
    this.configs.name = 'LockScreenClockWidgetTick';
    this.configs.stream.events = [
      'ftudone',
      'moztimechange',
      'lockscreen-notification-clock-tick'
    ];
    this.configs.stream.interrupts = [
      'screenchange'
    ];
    this._minuteSource = new MinuteClockSource({
      'type': 'lockscreen-notification-clock-tick'
    });

    this.configs.stream.sources =
      [new DOMEventSource({events: [
        'screenchange',
        'ftudone',
        'moztimechange',
        'screenchange',
        'lockscreen-notification-clock-tick'
        ]}),
        this._minuteSource
      ];
    this.handleEvent = this.handleEvent.bind(this);
  };
  LockScreenClockWidgetTick.prototype =
    Object.create(LockScreenBasicState.prototype);

  LockScreenClockWidgetTick.prototype.start = function() {
    console.log('>> LockScreenCLockWidetTick start');
    this.stream = new Stream(this.configs.stream);
    return this.stream.start(this.handleEvent)
      .next(this.component.updateClock.bind(this.component))
      .next(this.stream.ready.bind(this.stream));
  };

  LockScreenClockWidgetTick.prototype.stop =
  function() {
    console.log('>> LockScreenClockWidgetTick stop');
    return LockScreenBasicState.prototype.stop.call(this)
      .next(this._minuteSource.stop.bind(this._minuteSource));
  };

  LockScreenClockWidgetTick.prototype.handleEvent =
  function(evt) {
    switch (evt.type) {
      case 'ftudone':
      case 'moztimechange':
      case 'lockscreen-notification-clock-tick':
        this.component.updateClock();
        break;
      case 'screenchange':
        if (!evt.detail.screenEnabled) {
          return this.transferToSuspend();
        }
        break;
    }
  };

  LockScreenClockWidgetTick.prototype.transferToSuspend = function() {
    console.log('<< transferToSuspend called;');
    this.component.transferTo(LockScreenClockWidgetSuspend);
  };

  exports.LockScreenClockWidgetTick = LockScreenClockWidgetTick;
})(window);

