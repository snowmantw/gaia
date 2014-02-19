/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * The widget for the LockScreenSlide.
 * It's actually an adapter, which would forward the original
 * events from LockScreenSlide as new events, to fit the
 * new architecture.
 */
(function(exports) {

  var LockScreenSlideWidget = function() {
    this.listenEvents();
  };
  LockScreenSlideWidget.prototype = {
    configs: {
      events: ['will-unlock'],
      name: 'Slide'
    },
    slide: null
  };

  LockScreenSlideWidget.prototype.handleEvent =
  function lssw_handleEvent(evt) {
    switch (evt.type) {
      case 'will-unlock':
        this.publish('lockscreen-unregister-widget');
        break;
      case 'lockscreenslide-activate-left':
        this.requestInvokeCamera();
        break;
      case 'lockscreenslide-activate-right':
        this.requestUnlock();
        break;
      case 'lockscreenslide-unlocking-start':
        this.notifyUnlockingStart();
        break;
      case 'lockscreenslide-unlocking-stop':
        this.notifyUnlockingStop();
        break;
    }
  };

  LockScreenSlideWidget.prototype.activate =
  function lssw_activate() {
    var request = {
       'method': 'id',
       'selector': 'lockscreen-canvas',
       'response': this.initSlide.bind(this)
    };

    this.publish('lockscreen-request-canvas',
        {'name': this.configs.name, 'request': request});
  };

  LockScreenSlideWidget.prototype.deactivate =
  function lssw_deactivate() {
    this.suspendEvents();
  };

  LockScreenSlideWidget.prototype.initSlide =
  function lssw_initSlide(canvas) {
    this.listenSlideEvents();

    // TODO: Abstraction leak: the original slide would
    // find its own elements beyound the frame we got here.
    // Should fix it to restrict the slide only use components
    // inside the frame.
    this.slide = new window.LockScreenSlide();
  };

  LockScreenSlideWidget.prototype.requestInvokeCamera =
  function lssw_requestInvokeCamera() {
    var activityContent = {
          name: 'record',
          data: {'type': 'photos'}
        },
        activityError = ()=> {
          console.log('MozActivity: camera launch error.');
        },
        request = {
          'method': 'activity',
          'detail': {
            'content': activityContent,
            'onerror': activityError
          }
        };

    this.publish('lockscreen-request-invoke',
      { 'request': request }
    );
  };

  LockScreenSlideWidget.prototype.requestUnlock =
  function lssw_requestUnlock() {
    this.publish('lockscreen-request-unlock');
  };

  LockScreenSlideWidget.prototype.notifyUnlockingStart =
  function lssw_notifyUnlockingStart() {
    // Forwarding because screen manager need this.
    this.publish('unlocking-start');
  };

  LockScreenSlideWidget.prototype.notifyUnlockingStop =
  function lssw_notifyUnlockingStop() {
    // Forwarding because screen manager need this.
    this.publish('unlocking-stop');
  };

  LockScreenSlideWidget.prototype.listenEvents =
  function lssw_suspendEvents() {
    this.configs.events.forEach((ename)=> {
      window.addEventListener(ename, this);
    });
  };

  LockScreenSlideWidget.prototype.listenSlideEvents =
  function lssw_listenSlideEvents() {
    window.addEventListener('lockscreenslide-activate-left', this);
    window.addEventListener('lockscreenslide-activate-right', this);
    window.addEventListener('lockscreenslide-unlocking-start', this);
    window.addEventListener('lockscreenslide-unlocking-stop', this);
  };

  LockScreenSlideWidget.prototype.suspendSlideEvents =
  function lssw_suspendSlideEvents() {
    window.removeEventListener('lockscreenslide-activate-left', this);
    window.removeEventListener('lockscreenslide-activate-right', this);
    window.removeEventListener('lockscreenslide-unlocking-start', this);
    window.removeEventListener('lockscreenslide-unlocking-stop', this);
  };

  LockScreenSlideWidget.prototype.suspendEvents =
  function lssw_suspendEvents() {
    this.configs.events.forEach((ename)=> {
      window.removeEventListener(ename, this);
    });
  };

  LockScreenSlideWidget.prototype.publish =
  function lssw_publish(type, detail) {
    detail = detail || {};
    if (!detail.name) {
      detail.name = this.configs.name;
    }
    window.dispatchEvent(new CustomEvent(type,
      {'detail': detail}));
  };

  /** @exports LockScreenSlideWidget */
  exports.LockScreenSlideWidget = LockScreenSlideWidget;
})(window);
