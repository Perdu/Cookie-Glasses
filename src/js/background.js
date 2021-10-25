/* global chrome */
/* global browser */
import {
  API_MSG, GET_TC_DATA_CALL, LOOKING_FOR_LOCATOR_MSG, NOT_FOUND_MSG, FOUND_MSG,
} from '../content_scripts/uCookie';

let api;
let cmpLocatorFound = false;
let fetchDataIntervalId;

if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

function fetchData(port) {
  let message;
  try {
    if (!cmpLocatorFound) {
      message = { message: LOOKING_FOR_LOCATOR_MSG };
    } else {
      message = { message: API_MSG, api: GET_TC_DATA_CALL, manual: false };
    }

    // send message to uCookie.js
    port.postMessage(message);
  } catch (error) {
    console.log('background.js: error caught', error);
  }
}

function handleMessageFromUCookie(message) {
  if (!message || !message.response) { return; }
  const { response } = message;

  switch (response) {
    case NOT_FOUND_MSG:
      // TODO: show user that this page does not implement TCF
      // CMP iframe isn't present on this page so stop calling fetchData
      window.clearInterval(fetchDataIntervalId);
      break;
    case FOUND_MSG:
      cmpLocatorFound = true;

      // TODO:
      // - update UI that cmp was found
      break;
    case GET_TC_DATA_CALL:
      // TODO:  write function to handle getTCData response
      console.log('received tcData!', message);
      window.clearInterval(fetchDataIntervalId);
      break;
    default:
      console.log('[background.js] Unknown response: ', response);
  }
}

function handleDisconnect(port) {
  // TODO: show an error to the user if the port was disconnected
  console.log('[background.js] Port was closed', port);
}

// Once the we connect to the port, start pinging the
// content script (uCookie.js) to let us know if the API locator
// frame was found and we can start fetching TC data
api.runtime.onConnect.addListener((port) => {
  fetchData(port);

  fetchDataIntervalId = window.setInterval(() => {
    fetchData(port);
  }, 5000);

  port.onDisconnect.addListener(handleDisconnect);
  port.onMessage.addListener(handleMessageFromUCookie);
});
