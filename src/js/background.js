/* global chrome */
/* global browser */
import '../popup/img/Octicons-tools.png';
import '../popup/img/question_mark.svg';
import '../popup/IAB_CMP_list_full';
import '../button/19_green.png';
import '../button/19_red.png';
import '../button/19.png';
import '../button/38_green.png';
import '../button/38_red.png';
import '../button/38.png';

let api;

if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

// function fetchData() {
//   api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//     if (tabs[0] === undefined) {
//       return;
//     }

//     // const port = chrome.tabs.onConnect();

//     // send message to uCookie.js
//     // eslint-disable-next-line no-use-before-define
//     api.tabs.postMessage({ greeting: 'hello' });
//   });
// }

chrome.runtime.onConnect.addListener((port) => {
  console.log('popup.js PORT', port);
  window.setInterval(() => {
    port.postMessage({ greeting: 'hello' });
  }, 5000);
});

// window.setInterval(() => {
//   fetchData();
// }, 5000);

// chrome.runtime.onConnect.addListener((port) => {
//   console.log('ooo port', port);
//   port.postMessage({ message: 'hello' });

//   port.onMessage.addListener((message) => {
//     console.log('ooo on message: ', message);
//   });
// });
