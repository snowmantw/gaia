'use strict';

function OnlyInputText(client) {
  this.appScheme = 'app://';
  this.client = client;
  this.domain = 'onlyinputtext.gaiamobile.org';
  this.origin = this.appScheme + this.domain;
  this.path = __dirname + '/../../apps/onlyinputtext'
}

module.exports = OnlyInputText;

OnlyInputText.Selector = Object.freeze({
  theInputElement: '#theinput'
});

OnlyInputText.prototype = {
  client: null,
  get theInputElement() {
    return this.client.findElement(OnlyInputText.Selector.theInputElement);
  },
  close: function() {
    this.client.apps.close(this.origin);
  },
  runInApp: function(callback) {
    this.client.apps.switchToApp(this.origin);
    callback();
    this.client.switchToFrame();
  },
  launchInBackground: function() {
    this.client.apps.launch(this.origin);
    this.client.apps.switchToApp(this.origin);

    // Wait until the app has told us it's fully loaded.
    this.client.helper.waitForElement('body.loaded');

    this.client.switchToFrame();
  }
};

