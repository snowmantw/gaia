/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * The demo widget for WIP patch.
 */
(function(exports) {

  var DemoWidget = function() {
    this.listenEvents();
    this.publish('lockscreen-register-widget',
      {'name': this.configs.name, 'widget': this});
  };
  DemoWidget.prototype = {
    configs: {
      events: ['will-unlock'],
      name: 'DemoWidget'
    },
    elements: {
      lock: null,
      unlock: null,
      camera: null
    }
  };

  DemoWidget.prototype.handleEvent =
  function dw_handleEvent(evt) {
    switch(evt.type) {
      case 'will-unlock':
        this.publish('lockscreen-unregister-widget',
            {'name': this.configs.name});
        break;
    }
  };

  DemoWidget.prototype.listenEvents =
  function dw_listenEvents() {
    this.configs.events.forEach((ename)=> {
        window.addEventListener(ename, this);
      });
  };

  DemoWidget.prototype.suspendEvents =
  function dw_suspendEvents() {
    this.configs.events.forEach((ename)=> {
        window.removeEventListener(ename, this);
      });
  };
  DemoWidget.prototype.activate = function() {
    var request = {
       'method': 'id',
       'selector': 'lockscreen-demo-widget',
       'response': this.initElements.bind(this)
    };

    this.publish('lockscreen-request-canvas',
        {'name': this.configs.name, 'request': request});
  };
  DemoWidget.prototype.deactivate = function() {
    this.suspendEvents();
  };
  DemoWidget.prototype.initElements = function(canvas) {
    this.elements.lock = canvas.querySelector('.dw-lock');
    this.elements.unlock = canvas.querySelector('.dw-unlock');
    this.elements.camera = canvas.querySelector('.dw-camera');

    this.elements.lock.addEventListener('click', ()=> {
      this.fireLock();
    });

    this.elements.unlock.addEventListener('click', ()=> {
      this.fireUnlock();
    });

    this.elements.camera.addEventListener('click', ()=> {
      this.fireCamera();
    });
  };

  DemoWidget.prototype.fireLock = function() {
    this.publish('lockscreen-request-lock', {'name': this.configs.name});
  };

  DemoWidget.prototype.fireUnlock = function() {
    this.publish('lockscreen-request-unlock', {'name': this.configs.name});
  };

  DemoWidget.prototype.fireCamera = function() {
    var cameraAppUrl =
      window.location.href.replace('system', 'camera');
    var cameraAppManifestURL =
      cameraAppUrl.replace(/(\/)*(index.html)*$/, '/manifest.webapp');
    cameraAppUrl = cameraAppUrl.replace(/(\/)*(index.html)*$/, '/index.html');
    cameraAppUrl += '#secure';
    var request = {
      'method': 'secureapp',
      'detail': {'url': cameraAppUrl,
                 'manifestURL': cameraAppManifestURL}
      };
    this.publish('lockscreen-request-invoke',
      { 'name': this.configs.name,
        'request': request
      }
    );
  };

  DemoWidget.prototype.publish = function(type, detail) {
    window.dispatchEvent(new CustomEvent(type, {'detail': detail}));
  };

  /** @exports LockScreenDemoWidget */
  exports.LockScreenDemoWidget = DemoWidget;
})(self);
