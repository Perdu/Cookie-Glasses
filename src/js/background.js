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

function handleMessageFromUCookie(message, port, activeTabId) {
  if (!message || !message.response) { return; }
  const { response } = message;
  try {
    switch (response) {
      case NOT_FOUND_MSG:
        api.storage.local.set({
          [activeTabId]:
          {
            tcfapiLocatorFound: false,
            gdprApplies: false,
            tcString: undefined,
            timestamp: Date.now(),
          },
        });
        break;
      case FOUND_MSG:
        // uCookie found the tcfapiLocator frame
        // send a message back asking for the TC Data
        port.postMessage({ message: API_MSG, api: GET_TC_DATA_CALL, manual: false });
        break;
      case GET_TC_DATA_CALL:
        console.log('received tcData!', message);
        api.storage.local.set({
          [activeTabId]:
          {
            tcfapiLocatorFound: true,
            gdprApplies: message.data.tcData.gdprApplies,
            tcString: message.data.tcData.tcString,
            timestamp: Date.now(),
          },
        });
        break;
      default:
        console.log('[background.js] Unknown response: ', response);
    }
  } catch (error) {
    console.log('Error handling message: ', error);
  }
}

function handleDisconnect(port) {
  console.log('[background.js] Port was closed', port.name);
}

let contentScriptPort;
api.storage.local.clear();

function setUpConnection() {
  if (contentScriptPort) {
    console.log('disconnecting port', contentScriptPort);
    contentScriptPort.disconnect();
    contentScriptPort = undefined;
  }
  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // set up a connection with the active tab's content script (uCookie)
    const activeTabId = tabs[0].id;
    console.log('activeTabId', tabs[0].id);
    contentScriptPort = api.tabs.connect(tabs[0].id, { name: String(tabs[0].id) });
    console.log('connected to port: ', contentScriptPort);

    // ask if the cmp frame has been located
    askForCmpFrame(contentScriptPort);

    contentScriptPort.onMessage.addListener((message) => {
      handleMessageFromUCookie(message, contentScriptPort, activeTabId);
    });

    contentScriptPort.onDisconnect.addListener(handleDisconnect);
  });
}

api.tabs.onActivated.addListener(() => {
  setUpConnection();
});

// TODO: reset connection when page refreshes (i.e. uCookie gets refreshes)

chrome.webNavigation.onCommitted.addListener((details) => {
  if (['reload', 'link', 'typed', 'generated'].includes(details.transitionType)) {
    if (details.frameId === 0) {
      setTimeout(() => { console.log('page reloaded, setting up uCookie connection'); setUpConnection(); }, 1000);
    }
  }
});
