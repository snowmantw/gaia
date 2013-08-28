var assert = require('assert'),
    LockScreenTest = require('./lockscreen').LockScreenTest,
    FTU = require('./lockscreen').FTU,
    Wait = require('./lockscreen').Wait,
    Marionette = require('marionette-client'),
    util = require('util');

function LockScreenTest(client, origin) {
  this.client = client;
  this.origin = origin;
}

marionette('lockscreen tests:', function() {
  var urls = {
    system: 'app://system.gaiamobile.org'
  };
  var client = marionette.client();

  test('pull the right handle to the end & unlock', function() {

    var lockscreen = new LockScreenTest(client, urls.system);
    var ftu = new FTU(client, urls.system);
    var wait = new Wait(client);

    // Wait secs for initialization, skipping the FTU and then
    // the disappearing of the FTU itself.
    wait.sec(3);
    ftu.skip();
    wait.sec(3);

    // After FTU disappears, the lockscreen is not displayed.
    lockscreen.lock();

    client.waitFor(function() { return lockscreen.locked }, 10000);

    // Move the handle to the right. 300px should be enough.
    (new Marionette.Actions(client))
      .press(lockscreen.sliderRight)
      .moveByOffset(300, 0)
      .release()
      .wait(2)
      .perform();

    assert.equal(false, lockscreen.panel.displayed(),
      'unlock the screen if the user pulled to end');
  });

  test('pull the right handle NOT to the end', function() {

    var lockscreen = new LockScreenTest(client, urls.system);
    var ftu = new FTU(client, urls.system);
    var wait = new Wait(client);

    // Wait secs for initialization, skipping the FTU and then
    // the disappearing of the FTU itself.
    wait.sec(3);
    ftu.skip();
    wait.sec(3);

      // After FTU disappears, the lockscreen is not displayed.
    lockscreen.lock();

    client.waitFor(function() { return lockscreen.locked }, 10000);

    // Move the handle to the right. 60px should be enough.
    (new Marionette.Actions(client))
      .press(lockscreen.sliderRight)
      .moveByOffset(60, 0)
      .release()
      .wait(2)
      .perform();

    assert.equal(true, lockscreen.panel.displayed(),
      'NOT unlock the screen if the user NOT pulled to end');
  });

});
