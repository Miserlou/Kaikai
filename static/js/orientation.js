/*
* Hacky indirect orientation layer to propagate orientation events to iframes
*/
(function(globals) {

  var orientation;

  var GetScreenOrientation = function() {
    if (orientation !== undefined)
      return orientation;
    if (window.orientation !== undefined)
      return window.orientation;
    switch (window.screen.orientation || window.screen.mozOrientation) {
      case 'landscape-primary':
        return 90;
      case 'landscape-secondary':
        return -90;
      case 'portrait-secondary':
        return 180;
      case 'portrait-primary':
        return 0;
    }
    return 0;
 };

  var Orientation = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    propagationTarget: null,
    get orientation() {
      return GetScreenOrientation();
    }
  };

  var fakeDeviceOrientation = function(evt) {
    var e = new Event('deviceorientation');
    Orientation.alpha = e.alpha = evt.alpha;
    Orientation.beta = e.beta = evt.beta;
    Orientation.gamma = e.gamma = evt.gamma;
    window.dispatchEvent(e);
  };
  Orientation._fakeDeviceOrientation = fakeDeviceOrientation;

  var fakeOrientationChange = function(evt) {
    orientation = evt.orientation;
    var e = new Event('orientationchange');
    e.orientation = GetScreenOrientation();
    window.dispatchEvent(e);
  };
  Orientation._fakeOrientationChange = fakeOrientationChange;

  var polyfillScreenTarget = function(target) {
    var o = GetScreenOrientation();
    console.log('polyfilling screen', o, target.orientation);
    switch (o) {
      case 90:
        target.screen.orientation = 'landscape-primary';
        break;
      case -90:
        target.screen.orientation = 'landscape-secondary';
        break;
      case 180:
        target.screen.orientation = 'portrait-secondary';
        break;
      case 0:
        target.screen.orientation = 'portrait-primary';
        break;
    }
  };

  Orientation._polyfillScreenTarget = polyfillScreenTarget;

  var polyfillScreen = function() {
    polyfillScreenTarget(window);
  };

  var onMessageEvent = function(evt) {
    console.log('message');
    var e;
    try {
      e = JSON.parse(evt.data);
    } catch (err) {
      return;
    }
    console.log('fake event', e.type, e.data);
    switch (e.type) {
      case 'deviceorientation':
        fakeDeviceOrientation(e.data);
        break;
      case 'orientationchange':
        fakeOrientationChange(e.data);
        break;
    }
  };

  Orientation.propagate = {
    deviceorientation: function(evt) {
      console.log('deviceorientation', Orientation.propagationTarget);
      if (!Orientation.propagationTarget) return;
      Orientation.propagationTarget.postMessage(
        JSON.stringify({type: 'deviceorientation', data: {
          alpha: evt.alpha,
          beta: evt.beta,
          gamma: evt.gamma
        }}), '*');
    },
    orientationchange: function(evt) {
      console.log('orientationchange', Orientation.propagationTarget);
      if (!Orientation.propagationTarget) return;
      Orientation.propagationTarget.postMessage(
        JSON.stringify({type: 'orientationchange', data: {
          orientation: Orientation.orientation
        }}), '*');
    }
  };

  Orientation.bind = function() {
    var targetEvents = Array.prototype.slice.call(arguments);
    targetEvents.forEach(function(eventName) {
      switch (eventName) {
        case 'deviceorientation':
        case 'orientationchange':
          window.addEventListener(eventName, Orientation.propagate[eventName]);
          break;
      }
    });
  };

  Orientation.unbind = function() {
    var targetEvents = Array.prototype.slice.call(arguments);
    targetEvents.forEach(function(eventName) {
      switch (eventName) {
        case 'deviceorientation':
        case 'orientationchange':
          window.removeEventListener(eventName, Orientation.propagate[eventName]);
          break;
      }
    });
  };

  window.addEventListener('message', onMessageEvent, false);
  window.addEventListener('orientationchange', polyfillScreen, false);


  globals.Orientation = Orientation;

})(this);
