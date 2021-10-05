/* eslint-disable no-underscore-dangle */
const TCF_VERSION_NUMBER = 2;

let api;

if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

function setUpCmpWrapper() {
  // find the CMP frame
  let f = window;
  let cmpFrame;
  while (!cmpFrame) {
    try {
      if (f.frames.__tcfapiLocator) {
        cmpFrame = f;
        break;
      }
    } catch (ignore) {
      // ignore so we can keep searching for the __tcfapiLocator frame
    }
    if (f === window.top) { break; }
    f = f.parent;
  }

  if (!cmpFrame) {
    return 0;
  }

  const cmpCallbacks = {};

  /* Set up a __cmp function to do the postMessage and
       stash the callback.
       This function behaves (from the caller's perspective)
       identically to the in-frame __cmp call */
  window.__tcfapiCookieGlasses = (cmd, version, callback, arg) => {
    const callId = `uCookie_${Math.random()}`;
    const msg = {
      __tcfapiCall: {
        command: cmd,
        parameter: arg,
        version,
        callId,
      },
    };

    cmpCallbacks[callId] = callback;
    cmpFrame.postMessage(msg, '*');
  };

  // handles incoming messages from CMP
  function postMessageHandler(event) {
    /**
      * when we get the return message, call the mapped callback
      */
    let json = {};

    try {
      /**
         * if this isn't valid JSON then this will throw an error
         */
      json = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (ignore) {
      // ignore parsing error
    }

    const payload = json.__tcfapiReturn;

    if (payload) {
      // messages we care about will have a payload
      if (typeof cmpCallbacks[payload.callId] === 'function') {
        // call the mapped callback and then remove the reference
        cmpCallbacks[payload.callId](payload.returnValue, payload.success);
        cmpCallbacks[payload.callId] = null;
      }
    }
  }

  window.addEventListener('message', postMessageHandler, false);

  return 1;
}

function callCmp(request, sender, sendResponse) {
  // respond to query checking whether there is a __tcfapiLocator iframe
  if (request.test === 'looking for __tcfapiLocator') {
    sendResponse({ response: 'found' });
    return true;
  }

  // call CMP
  window.__tcfapiCookieGlasses(request.call, TCF_VERSION_NUMBER, (tcData, success) => {
    if (request.manual) {
      console.log('Cookie Glasses: success', success);
      console.log('Cookie Glasses: response from CMP:', tcData);
    }

    sendResponse({ response: tcData });
  });

  return true;
}

const correctFrame = setUpCmpWrapper();
if (correctFrame) {
  api.runtime.onMessage.addListener(callCmp);
}
