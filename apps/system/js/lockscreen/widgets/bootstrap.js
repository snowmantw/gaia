/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * This widget will load preset widgets.
 *
 * TODO: It's now use a const array to load
 * all widgets, but it should be able to load
 * this preset list from external resources,
 * so different build can launch different widgets.
 */
(function(exports) {

  var LockScreenBootstrapWidget = function() {};
  LockScreenBootstrapWidget.prototype = {
    configs: {
      widgets: [
        'Slide',
        'UnlockingSound'
      ],
      name: 'Bootstrap'
    }
  };

  LockScreenBootstrapWidget.prototype.bootstrap =
  function lsbw_bootstrap() {
    this.configs.widgets.forEach((name)=> {
      var request = { 'method': 'widget',
                      'detail': {'name': name}
                    },
          edetail = { 'name': this.configs.name,
                      'request': request},
          e = new CustomEvent('lockscreen-request-invoke', {
            'detail': edetail
          });
      window.dispatchEvent(e);
    });
  };

  LockScreenBootstrapWidget.prototype.activate =
  function lsbw_activated() {
    this.bootstrap();
  };

  LockScreenBootstrapWidget.prototype.deactivate =
  function lsbw_deactivated() {};

  /** @global LockScreenBootstrapWidget */
  exports.LockScreenBootstrapWidget = LockScreenBootstrapWidget;
})(window);
