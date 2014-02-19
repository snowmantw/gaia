/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * The LockScreen now is a mediator, which would only handle
 *
 * 1. request unlock/lock
 * 2. request invoke something
 * 3. request to register/unregister a widget
 * 4. request an element (canvas) to manipulate
 *
 * from widgets.
 *
 */
(function(exports) {

  var LockScreenMediator = function() {
    this.listenEvents();
    this.bootstrap();
  };
  LockScreenMediator.prototype = {
    states: {
      locked: false
    },
    elements: {},
    configs: {
      requests: [
        'lockscreen-request-lock',
        'lockscreen-request-unlock',
        'lockscreen-request-invoke',
        'lockscreen-request-canvas'
      ],
      events: [
        'lockscreen-register-widget',
        'lockscreen-unregister-widget'
      ]
    },
    widgets: {}
  };

  LockScreenMediator.prototype.handleEvent =
  function lsm_handleEvent(evt) {
    var name = evt.detail.name,
        widget = this.widgets[name];

    // Only handle registered widgets.
    if (!widget) {
      switch (evt.type) {
        case 'lockscreen-register-widget':
          this.register(name, evt.detail.widget);
          break;
        case 'lockscreen-unregister-widget':
          this.unregister(name);
          break;
      }
    } else {
      switch(evt.type) {
        case 'lockscreen-request-lock':
          this.responseLock();
          break;
        case 'lockscreen-request-unlock':
          this.responseUnlock();
          break;
        case 'lockscreen-request-invoke':
          this.responseInvoke(evt.detail.request);
          break;
        case 'lockscreen-request-canvas':
          this.responseCanvas(evt.detail.request);
          break;
      }
    }
  };

  LockScreenMediator.prototype.listenEvents =
  function lsm_listenEvents() {
    this.configs.requests.concat(this.configs.events)
      .forEach((ename)=> {
        window.addEventListener(ename, this);
      });
  };

  LockScreenMediator.prototype.suspendEvents =
  function lsm_suspendEvents() {
    this.configs.requests.concat(this.configs.events)
      .forEach((ename)=> {
        window.removeEventListener(ename, this);
      });
  };

  LockScreenMediator.prototype.register =
  function lsm_register(name, widget) {
    if (this.widgets[name]) {
      return;
    }
    this.widgets[name] = widget;
    widget.activate();
  };

  LockScreenMediator.prototype.unregister =
  function lsm_unregister(name) {
    if (!this.widgets[name]) {
      return;
    }
    var widget = this.widgets[name];
    widget.deactivate();
    delete this.widgets[name];
  };


  LockScreenMediator.prototype.responseLock =
  function lsm_requestLock() {
    // TODO: Do real lock. This is for demo.
    // Must handle passcode.
    self.lockScreen.lock();
  };

  LockScreenMediator.prototype.responseUnlock =
  function lsm_requestUnlock() {
    // TODO: Do real lock. This is for demo.
    // Must handle passcode.
    self.lockScreen.unlock();
  };

  LockScreenMediator.prototype.responseInvoke =
  function lsm_responseInvoke(request) {
    // Target: SecureApp, Widget or Activity.
    var {method, detail} = request,
        fn = (method === 'secureapp') ?
             this.invokeSecureApp.bind(this) :
             ((method === 'activity') ?
             this.invokeActivity.bind(this) :
             this.invokeWidget.bind(this));
    fn(detail);
  };

  LockScreenMediator.prototype.responseCanvas =
  function lsm_responseCanvas(request) {
    var {method, selector, response} = request,
        fn = (method === 'id') ?
          document.getElementById.bind(document) :
          document.querySelector.bind(document),
        canvas = fn(selector);

    // TODO: If we have shadow DOM here, we can isolate widgets better.
    if (!canvas) {
      throw new Error('Can\t locate the widget canvas element with selector: ' +
        selector);
    }
    response(canvas);
  };

  LockScreenMediator.prototype.invokeSecureApp =
  function lsm_invokeSecureApp(detail) {
    var {url, manifestURL} = detail;
    this.publish('secure-launchapp',
      { 'appURL': url,
        'appManifestURL': manifestURL
      }
    );
  };

  LockScreenMediator.prototype.invokeActivity =
  function lsm_invokeActivity(detail) {
    // Activity would be trigger then we will unlock.
    var {content, onsuccess, onerror} = detail,
        activity = new window.MozActivity(content);
    activity.onerror   = onerror   || (()=>{});
    activity.onsuccess = onsuccess || (()=>{});
    this.responseUnlock();
  };

  LockScreenMediator.prototype.invokeWidget =
  function lsm_invokeWidget(request) {
    if (!this.widgets[request.name]) {
      this.publish('lockscreen-launch-widget',
        {'request': {'name': request.name}});
    } else {
      this.widgets[request.name].activate();
    }
  };

  LockScreenMediator.prototype.publish =
  function lsm_publish(type, detail) {
    window.dispatchEvent(new CustomEvent(type, {'detail': detail}));
  };

  LockScreenMediator.prototype.bootstrap =
  function lsm_bootstrap() {
    // The only one default widget would
    // be launched by this mediator.
    var request = { 'name': 'Bootstrap' };
    var detail = { 'request': request };
    this.publish('lockscreen-launch-widget', detail);
  };

  /** @exports LockScreenMediator */
  exports.LockScreenMediator = LockScreenMediator;
})(self);
