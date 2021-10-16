/* eslint-disable no-underscore-dangle */
/* global chrome */
/* global browser */

const TCF_VERSION_NUMBER = 2;

let api;

if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

function getCmpFrame() {
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
    return null;
  }
  return cmpFrame;
}

function setUpCmpWrapper() {
  const cmpFrame = getCmpFrame();
  if (cmpFrame === null) {
    // The CMP frame was not present
    return false;
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

  return true;
}

const foundCmpFrame = setUpCmpWrapper();

function callPopupJs(request, sender, sendResponseToPopupJs) {
  // respond to query checking whether there is a __tcfapiLocator iframe
  if (request.check_cmp_frame === 'looking for __tcfapiLocator') {
    if (foundCmpFrame) {
      sendResponseToPopupJs({ response: 'found' });
    } else {
      sendResponseToPopupJs({ response: 'not found' });
    }
    return true;
  } if (request.call === 'getTCData') {
    // call CMP to get consentData and send it back to popup.js
    window.__tcfapiCookieGlasses(request.call, TCF_VERSION_NUMBER, (tcData, success) => {
      if (request.manual) {
        console.log('Cookie Glasses: success', success);
        console.log('Cookie Glasses: response from CMP:', tcData);
      }

      sendResponseToPopupJs({ response: { tcData } });
    });
  }
  return true;
}

api.runtime.onMessage.addListener(callPopupJs);
