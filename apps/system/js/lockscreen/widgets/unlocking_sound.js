/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * This widget will detect if it need to play the unlocking sound.
 */
(function(exports) {

  var LockScreenUnlockingSoundWidget = function() {};
  LockScreenUnlockingSoundWidget.prototype = {
    states: {
      observeSettings: false,
      soundEnabled: false
    },
    configs: {
      name: 'UnlockingSound',
      // TODO: customizable unlocking sound?
      soundFileURL: './resources/sounds/unlock.opus'
    }
  };

  LockScreenUnlockingSoundWidget.prototype.handleEvent =
  function (evt) {
    if ('will-unlock' === evt.type) {
      this.playSound();
    }
  };

  LockScreenUnlockingSoundWidget.prototype.activate =
  function () {
    window.addEventListener('will-unlock', this);

    // Already set observer. Because it's no way to cancel
    // a observer according to the listener's APIs.
    if (this.states.observeSettings) {
      return;
    }
    this.states.observeSettings = true;
    window.SettingsListener.observe('lockscreen.unlock-sound.enabled',
      true, (function(value) {
      this.setSoundEnabled(value);
    }).bind(this));
  };

  LockScreenUnlockingSoundWidget.prototype.deactivate =
  function () {
    window.removeEventListener('will-unlock', this);
  };

  LockScreenUnlockingSoundWidget.prototype.playSound =
  function () {
    if (this.states.soundEnabled) {
      var unlockAudio = new Audio(this.configs.soundFileURL);
      unlockAudio.play();
    }
  };

  LockScreenUnlockingSoundWidget.prototype.setSoundEnabled =
  function (val) {
    if (typeof val === 'string') {
      this.states.soundEnabled = val == 'false' ? false : true;
    } else {
      this.states.soundEnabled = val;
    }
  };

  /** @global LockScreenUnlockingSoundWidget */
  exports.LockScreenUnlockingSoundWidget = LockScreenUnlockingSoundWidget;

})(window);
