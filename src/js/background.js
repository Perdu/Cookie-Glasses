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
            found: false,
            gdprApplies: false,
            tcString: undefined,
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

        // TODO(ctan): add timestamp so we know when last updated
        api.storage.local.set({
          [activeTabId]:
          {
            found: true,
            gdprApplies: message.data.tcData.gdprApplies,
            tcString: message.data.tcData.tcString,
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
  // TODO: show an error to the user if the port was disconnected
  console.log('[background.js] Port was closed', port.name);
}

let contentScriptPort;
api.storage.local.clear();

function setUpConnection() {
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
  if (contentScriptPort) {
    console.log('disconnecting port', contentScriptPort);
    contentScriptPort.disconnect();
  }

  setUpConnection();
});

// TODO: reset connection when page refreshes (i.e. uCookie gets refreshes)
setUpConnection();