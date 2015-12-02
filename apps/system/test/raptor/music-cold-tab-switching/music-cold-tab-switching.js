'use strict';

var Music = require(__dirname + '/../../../../music/test/marionette/lib/music');


var actions = function(phase) {
  return phase.device.marionette
    .startSession()
    .then(function(client) {
      var mark = function(mark) {
        client.executeScript(function(markname) {
          window.wrappedJSObject.performance.mark(markname);
        }, [ mark ]);
      };
      var Mgmt = require(__dirname +
        '/../../../../../tests/jsmarionette/plugins/marionette-apps/lib/mgmt.js');
      var mgmt = new Mgmt(client);
      mgmt.prepareClient();
      var Loader = require(__dirname +
        '/../../../../../shared/test/integration/marionette_loader.js');
      client.loader = new Loader(client);
      var music = new Music(client);
      var sys = client.loader.getAppClass('system');
      var Deferred = function() {
        this.promise = new Promise((function(res, rej) {
          this.resolve = res;
          this.reject = rej;
        }).bind(this));
        return this;
      };
      var deferred = new Deferred();
      deferred.promise = deferred.promise.then(function() {
        client.deleteSession();
      }).catch(function(err) {
        console.error(err);
        throw err;
      });
      sys.waitForFullyLoaded();
      music.launch();
      mark('firstTabAppearing');

      mark('songsTabSwitching');
      music.switchToSongsView();
      mark('songsTabAppearing');

      mark('albumsTabSwitching');
      music.switchToAlbumsView();
      mark('albumsTabAppearing');

      mark('artistsTabSwitching');
      music.switchToArtistsView();
      mark('artistsTabAppearing');

      mark('playlistsTabSwitching');
      music.switchToPlaylistsView();
      mark('playlistsTabAppearing');

      deferred.resolve();
      return deferred.promise;
  });
};

/* global setup, afterEach, marionetteScriptFinished */
/* Test from lock to unlock, how long does it take. */
setup(function(options) {
  options.phase = process.env.RUNNING_PHASE;
  options.frame = {
    'begin': 'firstTabAppearing',
    'end': 'playlistsTabAppearing'
  };
  options.test = 'music-cold-tab-switching';
  options.actions = actions;
});

