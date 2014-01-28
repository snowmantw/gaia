/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Use the factory to create all available widgets.
 */
(function(exports) {

  var WidgetFactory = function() {
    this.configs.events.forEach((ename)=>{
      window.addEventListener(ename, this);
      this.configs.classes = {
        'LockScreenSlide': self.LockScreenSlide,
        'AlternativeCamera': self.LockScreenAlternativeCamera,
        'DemoWidget': self.LockScreenDemoWidget
      };
    });
  };
  WidgetFactory.prototype = {
    configs: {
      events: [
        'lockscreen-launch-widget'
      ],

      // Should be a static and growing list.
      classes: {}
    }
  };

  WidgetFactory.prototype.handleEvent =
  function wf_handleEvent(evt) {
    if ('lockscreen-launch-widget' === evt.type) {
      var request = evt.detail.request,
          widget = this.launch(evt.detail.request);
      this.publish('lockscreen-register-widget',
          { 'name': request.name,
            'widget': widget
          });
    }
  };

  WidgetFactory.prototype.launch =
  function wf_launch(request) {
    if (this.configs.classes[request.name]) {
      return new this.configs.classes[request.name]();
    } else {
      throw new Error('Can\'t launch an unknown widget: ' + request.name);
    }
  };

  WidgetFactory.prototype.publish =
  function wf_publish(type, detail) {
    window.dispatchEvent(new CustomEvent(type, {'detail': detail}));
  };

  /** @exports LockScreenWidgetFactory */
  exports.LockScreenWidgetFactory = WidgetFactory;
})(self);
