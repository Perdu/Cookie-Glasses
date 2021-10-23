/* eslint-disable no-underscore-dangle */
/* global chrome */
/* global browser */

export const TCF_VERSION_NUMBER = 2;
export const LOOKING_FOR_LOCATOR_MSG = 'looking for __tcfapiLocator';
export const FOUND_MSG = 'found';
export const NOT_FOUND_MSG = 'not found';
export const GET_TC_DATA_CALL = 'getTCData';

let api;

if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

// This line opens up a long-lived connection to your background page.
const port = chrome.runtime.connect({ name: 'mycontentscript' });
port.onMessage.addListener((message, sender) => {
  console.log('ucookie.js received a message: ', message);

  if (message.greeting === 'hello') {
    console.log('ucookie.js: ', message);
    alert(message.greeting);
  }
});

// api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//   if (tabs[0] === undefined) {
//     return;
//   }
//   const port = api.tabs.connect(tabs[0].id);
//   port.onMessage.addListener((message, sender) => {
//     console.log('ucookie.js received a message: ', message);

//     if (message.greeting === 'hello') {
//       console.log('ucookie.js: ', message);
//     }
//   });
// });

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

function handleMessage(message) {
  console.log('ooo received message', message);
  if (message.message === 'hello') {
    port.postMessage({ response: 'response from ucookie' });
  }

  // TODO: reimplement the logic below
  // sendResponseToPopupJs({ response: 'response!!!' });
  // // respond to query checking whether there is a __tcfapiLocator iframe
  // if (request.checkCmpFrame === LOOKING_FOR_LOCATOR_MSG) {
  //   if (foundCmpFrame) {
  //     sendResponseToPopupJs({ response: FOUND_MSG });
  //   } else {
  //     sendResponseToPopupJs({ response: NOT_FOUND_MSG });
  //   }
  //   return true;
  // } if (request.call === GET_TC_DATA_CALL) {
  //   // call CMP to get consentData and send it back to popup.js
  //   window.__tcfapiCookieGlasses(request.call, TCF_VERSION_NUMBER, (tcData, success) => {
  //     console.log('Cookie Glasses: success', success);
  //     console.log('Cookie Glasses: response from CMP:', tcData);
  //     if (request.manual) {
  //       console.log('Cookie Glasses: success', success);
  //       console.log('Cookie Glasses: response from CMP:', tcData);
  //     }

  //     sendResponseToPopupJs({ response: { tcData } });
  //   });
  // }
  return true;
}

// port.onMessage.addListener(handleMessage);
