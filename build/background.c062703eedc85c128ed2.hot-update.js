webpackHotUpdate("background",{

/***/ "./src/js/background.js":
/*!******************************!*\
  !*** ./src/js/background.js ***!
  \******************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _popup_img_Octicons_tools_png__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../popup/img/Octicons-tools.png */ \"./src/popup/img/Octicons-tools.png\");\n/* harmony import */ var _popup_img_Octicons_tools_png__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_popup_img_Octicons_tools_png__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _popup_img_question_mark_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../popup/img/question_mark.svg */ \"./src/popup/img/question_mark.svg\");\n/* harmony import */ var _popup_img_question_mark_svg__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_popup_img_question_mark_svg__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _popup_IAB_CMP_list_full__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../popup/IAB_CMP_list_full */ \"./src/popup/IAB_CMP_list_full.js\");\n/* harmony import */ var _popup_IAB_CMP_list_full__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_popup_IAB_CMP_list_full__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _button_19_green_png__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../button/19_green.png */ \"./src/button/19_green.png\");\n/* harmony import */ var _button_19_green_png__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_button_19_green_png__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _button_19_red_png__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../button/19_red.png */ \"./src/button/19_red.png\");\n/* harmony import */ var _button_19_red_png__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_button_19_red_png__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var _button_19_png__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../button/19.png */ \"./src/button/19.png\");\n/* harmony import */ var _button_19_png__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_button_19_png__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var _button_38_green_png__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../button/38_green.png */ \"./src/button/38_green.png\");\n/* harmony import */ var _button_38_green_png__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_button_38_green_png__WEBPACK_IMPORTED_MODULE_6__);\n/* harmony import */ var _button_38_red_png__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../button/38_red.png */ \"./src/button/38_red.png\");\n/* harmony import */ var _button_38_red_png__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_button_38_red_png__WEBPACK_IMPORTED_MODULE_7__);\n/* harmony import */ var _button_38_png__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../button/38.png */ \"./src/button/38.png\");\n/* harmony import */ var _button_38_png__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_button_38_png__WEBPACK_IMPORTED_MODULE_8__);\n/* global chrome */\n/* global browser */\n\n\n\n\n\n\n\n\n\n\nlet api;\n\nif (chrome === undefined) {\n  api = browser;\n} else {\n  api = chrome;\n}\n\n// function fetchData() {\n//   api.tabs.query({ active: true, currentWindow: true }, (tabs) => {\n//     if (tabs[0] === undefined) {\n//       return;\n//     }\n\n//     // const port = chrome.tabs.onConnect();\n\n//     // send message to uCookie.js\n//     // eslint-disable-next-line no-use-before-define\n//     api.tabs.postMessage({ greeting: 'hello' });\n//   });\n// }\n\nchrome.runtime.onConnect.addListener((port) => {\n  console.log('popup.js PORT', port);\n  window.setInterval(() => {\n    port.postMessage({ greeting: 'hello' });\n  }, 5000);\n});\n\n// window.setInterval(() => {\n//   fetchData();\n// }, 5000);\n\n// chrome.runtime.onConnect.addListener((port) => {\n//   console.log('ooo port', port);\n//   port.postMessage({ message: 'hello' });\n\n//   port.onMessage.addListener((message) => {\n//     console.log('ooo on message: ', message);\n//   });\n// });\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvanMvYmFja2dyb3VuZC5qcy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NyYy9qcy9iYWNrZ3JvdW5kLmpzPzgxMDQiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIGNocm9tZSAqL1xuLyogZ2xvYmFsIGJyb3dzZXIgKi9cbmltcG9ydCAnLi4vcG9wdXAvaW1nL09jdGljb25zLXRvb2xzLnBuZyc7XG5pbXBvcnQgJy4uL3BvcHVwL2ltZy9xdWVzdGlvbl9tYXJrLnN2Zyc7XG5pbXBvcnQgJy4uL3BvcHVwL0lBQl9DTVBfbGlzdF9mdWxsJztcbmltcG9ydCAnLi4vYnV0dG9uLzE5X2dyZWVuLnBuZyc7XG5pbXBvcnQgJy4uL2J1dHRvbi8xOV9yZWQucG5nJztcbmltcG9ydCAnLi4vYnV0dG9uLzE5LnBuZyc7XG5pbXBvcnQgJy4uL2J1dHRvbi8zOF9ncmVlbi5wbmcnO1xuaW1wb3J0ICcuLi9idXR0b24vMzhfcmVkLnBuZyc7XG5pbXBvcnQgJy4uL2J1dHRvbi8zOC5wbmcnO1xuXG5sZXQgYXBpO1xuXG5pZiAoY2hyb21lID09PSB1bmRlZmluZWQpIHtcbiAgYXBpID0gYnJvd3Nlcjtcbn0gZWxzZSB7XG4gIGFwaSA9IGNocm9tZTtcbn1cblxuLy8gZnVuY3Rpb24gZmV0Y2hEYXRhKCkge1xuLy8gICBhcGkudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9LCAodGFicykgPT4ge1xuLy8gICAgIGlmICh0YWJzWzBdID09PSB1bmRlZmluZWQpIHtcbi8vICAgICAgIHJldHVybjtcbi8vICAgICB9XG5cbi8vICAgICAvLyBjb25zdCBwb3J0ID0gY2hyb21lLnRhYnMub25Db25uZWN0KCk7XG5cbi8vICAgICAvLyBzZW5kIG1lc3NhZ2UgdG8gdUNvb2tpZS5qc1xuLy8gICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuLy8gICAgIGFwaS50YWJzLnBvc3RNZXNzYWdlKHsgZ3JlZXRpbmc6ICdoZWxsbycgfSk7XG4vLyAgIH0pO1xuLy8gfVxuXG5jaHJvbWUucnVudGltZS5vbkNvbm5lY3QuYWRkTGlzdGVuZXIoKHBvcnQpID0+IHtcbiAgY29uc29sZS5sb2coJ3BvcHVwLmpzIFBPUlQnLCBwb3J0KTtcbiAgd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICBwb3J0LnBvc3RNZXNzYWdlKHsgZ3JlZXRpbmc6ICdoZWxsbycgfSk7XG4gIH0sIDUwMDApO1xufSk7XG5cbi8vIHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4vLyAgIGZldGNoRGF0YSgpO1xuLy8gfSwgNTAwMCk7XG5cbi8vIGNocm9tZS5ydW50aW1lLm9uQ29ubmVjdC5hZGRMaXN0ZW5lcigocG9ydCkgPT4ge1xuLy8gICBjb25zb2xlLmxvZygnb29vIHBvcnQnLCBwb3J0KTtcbi8vICAgcG9ydC5wb3N0TWVzc2FnZSh7IG1lc3NhZ2U6ICdoZWxsbycgfSk7XG5cbi8vICAgcG9ydC5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UpID0+IHtcbi8vICAgICBjb25zb2xlLmxvZygnb29vIG9uIG1lc3NhZ2U6ICcsIG1lc3NhZ2UpO1xuLy8gICB9KTtcbi8vIH0pO1xuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/js/background.js\n");

/***/ })

})