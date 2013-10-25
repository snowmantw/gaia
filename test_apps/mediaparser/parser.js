(function() {

window.MediaParser = {
  init: function mp_init() {

    navigator.mozApps.getSelf().onsuccess = function(evt) {

      var app = evt.target.result;

      // Connect to the channel and post parsing information.
      // Of course the most ideal state is the parser should only response
      // requests, and don't spread out the messages it generated.
      app.connect('parserchannel').then(function onConnectionAccepted(ports) {
        ports.forEach(function(port) {
          port.onstart(function onstart() {
            port.postMessage({'title': 'Parser says...'});
          });
          port.onmessage = MediaParser.dispatcher;
        });
      });
    };

      console.log('MediaParser-- initialized');
  },

  dispatcher: function mp_dispatcher(e) {
    console.log('parser received: ', e.data);
  }
};

MediaParser.init();

})();
