
(function() {

window.ParserInvoker = {
  init: function pi_init() {

    navigator.mozSetMessageHandler('connection', function(connectionRequest) {
      if (connectionRequest.keyword !== 'parserchannel') {
        return;
      }
      var port = connectionRequest.port;
      port.onmessage = ParserInvoker.onParserSpeak;
      port.start();
    });
    console.log('ParserInvoker -- initialized');
  },

  onParserSpeak: function pi_onParserSpeak(e)
  {
    console.log('parser says: ', e.data);
  }
};

ParserInvoker.init();

})();
