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

  var LockScreen = function() {
    this.listenEvents();
  };
  LockScreen.prototype = {
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

  LockScreen.prototype.handleEvent =
  function ls_handleEvent(evt) {
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

  LockScreen.prototype.listenEvents =
  function ls_listenEvents() {
    this.configs.requests.concat(this.configs.events)
      .forEach((ename)=> {
        window.addEventListener(ename, this);
      });
  };

  LockScreen.prototype.suspendEvents =
  function ls_suspendEvents() {
    this.configs.requests.concat(this.configs.events)
      .forEach((ename)=> {
        window.removeEventListener(ename, this);
      });
  };

  LockScreen.prototype.register =
  function ls_register(name, widget) {
    if (this.widgets[name]) {
      return;
    }
    this.widgets[name] = widget;
    widget.activate();
  };

  LockScreen.prototype.unregister =
  function ls_unregister(name) {
    if (!this.widgets[name]) {
      return;
    }
    var widget = this.widgets[name];
    widget.deactivate();
    delete this.widgets[name];
  };


  LockScreen.prototype.responseLock =
  function ls_requestLock() {
    // TODO: Do real lock. This is for demo.
    self.lockScreen.lock();
  };

  LockScreen.prototype.responseUnlock =
  function ls_requestUnlock() {
    // TODO: Do real lock. This is for demo.
    self.lockScreen.unlock();
  };

  LockScreen.prototype.responseInvoke =
  function ls_requestInvoke(request) {
    // Target: either SecureApp or Widget.
    var {method, detail} = request,
        fn = (method === 'secureapp') ?
             this.invokeSecureApp.bind(this) :
             this.invokeWidget.bind(this);
    fn(detail);
  };

  LockScreen.prototype.responseCanvas =
  function ls_requestCanvas(request) {
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

  LockScreen.prototype.invokeSecureApp =
  function ls_invokeSecureApp(detail) {
    var {url, manifestURL} = detail;
    this.publish('secure-launchapp',
      { 'appURL': url,
        'appManifestURL': manifestURL
      }
    );
  };

  LockScreen.prototype.invokeWidget =
  function ls_invokeWidget(request) {
    if (!this.widgets[name]) {
      this.publish('lockscreen-launch-widget', {'name': name});
    } else {
      this.widgets[name].activate();
    }
  };

  LockScreen.prototype.publish =
  function wf_publish(type, detail) {
    window.dispatchEvent(new CustomEvent(type, {'detail': detail}));
  };

  /** @exports LockScreenMediator */
  exports.LockScreenMediator = LockScreen;

})(self);
