let api;
if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

function setup_cmp_wrapper() {
  // find the CMP frame
  let f = window;
  let cmpFrame;
  while (!cmpFrame) {
    try {
      if (f.frames.__cmpLocator) {
        cmpFrame = f;
      }
    } catch (e) {}
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

  window.__cmpCookieGlasses = function (cmd, arg, callback) {
    const callId = `uCookie_${Math.random()}`;
    const msg = {
      __cmpCall: {
        command: cmd,
        parameter: arg,
        callId,
      },
    };

    cmpCallbacks[callId] = callback;
    cmpFrame.postMessage(msg, '*');
  };

  /* when we get the return message, call the stashed callback */
  window.addEventListener('message', (event) => {
    let json;
    if (typeof event.data === 'string') {
      try {
        json = JSON.parse(event.data);
      } catch {
        json = event.data;
      }
    } else {
      json = event.data;
    }
    if (json.__cmpReturn) {
      const i = json.__cmpReturn;
      if (i.callId in cmpCallbacks) {
        cmpCallbacks[i.callId](i.returnValue, i.success);
        delete cmpCallbacks[i.callId];
      }
    }
  }, false);
  return 1;
}

function call_cmp(request, sender, sendResponse) {
  // respond to query checking whether there is a __cmpLocator iframe
  if (request.test == 'looking for __cmpLocator') {
    sendResponse({ response: 'found' });
    return true;
  }
  // call CMP
  __cmpCookieGlasses(request.call, null, (val, success) => {
    if (request.manual) {
      console.log('Cookie Glasses: response from CMP:', val);
    }
    sendResponse({ response: val });
  });
  return true;
}

const correct_frame = setup_cmp_wrapper();
if (correct_frame) {
  api.runtime.onMessage.addListener(call_cmp);
}
