(function(global) {

  var ctx;

  var AudioContext = window.AudioContext || window.webkitAudioContext;

  function getOrCreateContext() {
    if (ctx) {
      return ctx;
    }
    ctx = new AudioContext();
    return ctx;
  }

  function LoadAudio(url, callback) {

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
      var ctx = getOrCreateContext();
      if (!ctx) return;
      ctx.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            console.error('Error decoding file data');
            return;
          }

          callback(function() {
            var source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start();
          });

        },
        function(error) {
          console.error('Decoding error:' + error);
        }
      );
    };
    request.send(null);
    
  }

  global.LoadAudio = LoadAudio;

})(this);