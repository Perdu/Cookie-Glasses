/* global chrome */
/* global browser */
import {
  API_MSG,
  GET_TC_DATA_CALL,
  LOOKING_FOR_LOCATOR_MSG,
  NOT_FOUND_MSG,
  FOUND_MSG,
} from '../content_scripts/uCookie';

let api;
let cmpLocatorFound = false;
let fetchDataIntervalId;

if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

function askForCmpFrame(port) {
  try {
    // send message to uCookie.js
    port.postMessage({ message: LOOKING_FOR_LOCATOR_MSG });
  } catch (error) {
    console.log('background.js: error caught', error);
  }
}

function handleMessageFromUCookie(message, port) {
  if (!message || !message.response) { return; }
  const { response } = message;
  try {
    switch (response) {
      case NOT_FOUND_MSG:
      // TODO: show user that this page does not implement TCF
      // CMP iframe isn't present on this page so stop calling fetchData
        break;
      case FOUND_MSG:
        // uCookie found the tcfapiLocator frame
        // send a message back asking for the TC Data
        port.postMessage({ message: API_MSG, api: GET_TC_DATA_CALL, manual: false });
        break;
      case GET_TC_DATA_CALL:
      // TODO:  write function to handle getTCData response
        console.log('received tcData!', message);

        break;
      default:
        console.log('[background.js] Unknown response: ', response);
    }
  } catch (error) {
    console.log('Error handling message: ', error);
  }
}

function handleDisconnect(port) {
  // TODO: show an error to the user if the port was disconnected
  console.log('[background.js] Port was closed', port.name);
}

let contentScriptPort;
api.tabs.onActivated.addListener(() => {
  console.log('switched tabs!');
  cmpLocatorFound = false;

  if (contentScriptPort) {
    console.log('disconnecting port', contentScriptPort);
    contentScriptPort.disconnect();
  }

  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // set up a connection with the active tab's content script (uCookie)
    contentScriptPort = api.tabs.connect(tabs[0].id, { name: String(tabs[0].id) });
    console.log('connected to port: ', contentScriptPort);

    // ask if the cmp frame has been located
    askForCmpFrame(contentScriptPort);

    contentScriptPort.onMessage.addListener((message) => {
      handleMessageFromUCookie(message, contentScriptPort);
    });
    contentScriptPort.onDisconnect.addListener(handleDisconnect);
  });
});

// Once the we connect to the port, start pinging the
// content script (uCookie.js) to let us know if the API locator
// frame was found and we can start fetching TC data
// api.runtime.onConnect.addListener((port) => {
//   console.log('port name', port);

//   if (port.name === 'uCookie') {
//     fetchData(port);

//     fetchDataIntervalId = window.setInterval(() => {
//       fetchData(port);
//     }, 5000);

//     port.onMessage.addListener(handleMessageFromUCookie);
//   } else if (port.name === 'popup') {
//     popupPort = port;
//     port.onMessage.addListener(handleMessageFromPopup);
//   } else {
//     return;
//   }

//   window.setInterval(() => {
//     api.storage.local.set({ test: 'bye' });
//   }, 10000);

//   port.onDisconnect.addListener(handleDisconnect);
// });

// api.extension.onConnect.addListener((port) => {
//   console.log('port name::::', port.name);
//   port.onMessage.addListener((msg) => {
//     console.log(`message recieved ${msg}`);
//     port.postMessage('Hi Popup.js');
//   });
// });
