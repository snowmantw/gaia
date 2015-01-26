/* global Stream, DOMEventSource, TimerSource */
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
    this.configs.tickInterval = 1000;
    this._timerSource = new TimerSource({
      generator: () => {
        return { type: 'lockscreen-notification-clock-tick' };
      },
      interval: this.configs.tickInterval
    });

    this.configs.stream.sources =
      [new DOMEventSource({events: [
        'screenchange',
        'ftudone',
        'moztimechange',
        'screenchange',
        'lockscreen-notification-clock-tick'
        ]}),
        this._timerSource
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
      .next(this._timerSource.stop.bind(this._timerSource));
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

