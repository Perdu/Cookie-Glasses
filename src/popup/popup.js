/* eslint-disable no-underscore-dangle */
/* eslint-disable guard-for-in */
/* global chrome */
/* global browser */
import './img/Octicons-tools.png';
import './img/question_mark.svg';
import '../button/19_green.png';
import '../button/19_red.png';
import '../button/19.png';
import '../button/38_green.png';
import '../button/38_red.png';
import '../button/38.png';
import './ucookie.css';
import { TCString } from '@iabtcf/core';
import cmpListFull from './IAB_CMP_list_full';

let api;
if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

function handleCmpLocatorFound(cmpLocatorFound) {
  try {
    if (cmpLocatorFound === true) {
      document.getElementById('nothing_found').classList.add('hidden');
      document.getElementById('cmplocator_found').classList.remove('hidden');
    } else {
      document.getElementById('nothing_found').classList.remove('hidden');
      document.getElementById('cmplocator_found').classList.add('hidden');
    }
  } catch {
    // popup not open
  }
}

function handleGdprApplies(gdprApplies) {
  try {
    if (gdprApplies === true) {
      document.getElementById('gdpr_applies_false').classList.add('hidden');
      document.getElementById('cmplocator_found').classList.remove('hidden');
    } else {
      document.getElementById('gdpr_applies_false').classList.remove('hidden');
      document.getElementById('cmplocator_found').classList.add('hidden');
    }
  } catch {
    // popup not open
  }
}

function showTCString(tcString) {
  document.getElementById('consent_string').textContent = tcString;
}

function showCmp(cmpId) {
  if (cmpId in cmpListFull) {
    document.getElementById('cmpid').textContent = ` (ID: ${cmpId})`;
    document.getElementById('cmp').textContent = cmpListFull[cmpId];
  } else {
    document.getElementById('cmp').textContent = `Unknown CMP ID ${cmpId}. Search for it on the cmp-list: `;
    const a = document.createElement('a');
    a.href = 'https://iabeurope.eu/cmp-list/';
    a.appendChild(document.createTextNode('https://iabeurope.eu/cmp-list/'));
    document.getElementById('cmp').appendChild(a);
  }
}

function showNumVendors(vendorConsents) {
  document.getElementById('nb_vendors').textContent = vendorConsents.set_.size;
}

function showPurposes(purposeConsents) {
  document.getElementById('nb_purposes').textContent = purposeConsents.set_.size;
}

function showTimestamps(createdAt, lastUpdated) {
  document.getElementById('created').textContent = createdAt;
  document.getElementById('last_updated').textContent = lastUpdated;
}

function handleTCData(data) {
  showCmp(data.cmpId_);
  showNumVendors(data.vendorConsents);
  showPurposes(data.purposeConsents);
  showTimestamps(data.created, data.lastUpdated);
}

function getActiveTabStorage() {
  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs[0].id;
    console.log('active tab id', tabs[0].id);

    api.storage.local.get([String(activeTabId)], (result) => {
      const data = result[activeTabId];
      console.log('data from storage', data);

      // we've confirmed if the tcfapiLocator has been found
      if (data.found !== undefined) {
        handleCmpLocatorFound(data.found);
      } else {
        return;
      }

      if (data.gdprApplies !== undefined) {
        handleGdprApplies(data.gdprApplies);
      }

      // tcfapiLocator has been found & received tcString
      if (data.found === true && data.tcString !== undefined) {
        // no longer need to show found message
        document.getElementById('cmplocator_found').classList.add('hidden');
        document.getElementById('cmp_content').classList.remove('hidden');
        showTCString(data.tcString);

        const decodedString = TCString.decode(data.tcString);
        console.log('decoded string', decodedString);
        handleTCData(decodedString);
      }
    });
  });
}

getActiveTabStorage();

// ----------------------------- OLD LOGIC -----------------------------
let cmpLocatorFound = false;
let vendorListVersion = 2;
let consentString = null;

const descriptions = ['Information storage and access', 'Personalisation', 'Ad selection, delivery, reporting', 'Content selection, delivery, reporting', 'Measurement'];
const descriptionsLong = ['The storage of information, or access to information that is already stored, on your device such as advertising identifiers, device identifiers, cookies, and similar technologies.', 'The collection and processing of information about your use of this service to subsequently personalise advertising and/or content for you in other contexts, such as on other websites or apps, over time. Typically, the content of the site or app is used to make inferences about your interests, which inform future selection of advertising and/or content.', 'The collection of information, and combination with previously collected information, to select and deliver advertisements for you, and to measure the delivery and effectiveness of such advertisements. This includes using previously collected information about your interests to select ads, processing data about what advertisements were shown, how often they were shown, when and where they were shown, and whether you took any action related to the advertisement, including for example clicking an ad or making a purchase. This does not include personalisation, which is the collection and processing of information about your use of this service to subsequently personalise advertising and/or content for you in other contexts, such as websites or apps, over time.', 'The collection of information, and combination with previously collected information, to select and deliver content for you, and to measure the delivery and effectiveness of such content. This includes using previously collected information about your interests to select content, processing data about what content was shown, how often or how long it was shown, when and where it was shown, and whether the you took any action related to the content, including for example clicking on content. This does not include personalisation, which is the collection and processing of information about your use of this service to subsequently personalise content and/or advertising for you in other contexts, such as websites or apps, over time.', 'The collection of information about your use of the content, and combination with previously collected information, used to measure, understand, and report on your usage of the service. This does not include personalisation, the collection of information about your use of this service to subsequently personalise content and/or advertising for you in other contexts, i.e. on other service, such as websites or apps, over time.'];

function fetchData() {
  let message;
  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] === undefined) {
      return;
    }
    try {
      if (!cmpLocatorFound) {
        message = { checkCmpFrame: 'looking for __tcfapiLocator' };
      } else {
        message = { call: 'getTCData', manual: false };
      }
      // send message to uCookie.js
      // eslint-disable-next-line no-use-before-define
      api.tabs.sendMessage(tabs[0].id, message, handleResponseFromUCookieJs);
    } catch (error) {
      console.log('popup.js: error caught', error);
    }
  });
}

/*
  call fetchData every 5 seconds:
  1. need to continue checking if CMP iframe has been found
  2. need to continue checking for TC Data for any updates (ie cookie consent)
*/
const fetchDataIntervalId = window.setInterval(() => {
  // fetchData();
}, 5000);

function handleResponseFromUCookieJs(message) {
  if (!message || !message.response) { return; }
  const res = message.response;
  if (res === 'not found') {
    // CMP iframe isn't present on this page so stop calling fetchData
    window.clearInterval(fetchDataIntervalId);
    return;
  }
  if (res === 'found') {
    // CMP iframe is found
    cmpLocatorFound = true;
    fetchData();
    try {
      document.getElementById('nothing_found').classList.add('hidden');
      document.getElementById('cmplocator_found').classList.remove('hidden');
    } catch {
      // popup not open
    }
    return;
  }
  if (res.tcData) {
    const { gdprApplies, tcString, consentData } = res.tcData;
    if (gdprApplies === false) {
      document.getElementById('gdpr_applies_false').classList.remove('hidden');
      document.getElementById('cmplocator_found').classList.add('hidden');
    }
    console.log(res);
    if (tcString) {
      consentString = decodeConsentString(tcString);
    }
    const validCs = update_with_consent_string_data(consentString);
    if (!validCs) {
      return;
    }
    if (consentData) {
      document.getElementById('show_cs').classList.remove('hidden');
      document.getElementById('manual_cs').classList.add('hidden');
      document.getElementById('consent_string').textContent = res.tcData.consentData;
    }
    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (api.browserAction.setIcon) { // setIcon() won't work on mobile
        tab_id = tabs[0].id;
        if (nb_vendors * nb_purposes == 0) {
          api.browserAction.setIcon({
            tabId: tab_id,
            path: {
              19: '../button/19_green.png',
              38: '../button/38_green.png',
            },
          });
        } else {
          api.browserAction.setIcon({
            tabId: tab_id,
            path: {
              19: '../button/19_red.png',
              38: '../button/38_red.png',
            },
          });
        }
        api.browserAction.setBadgeText({
          tabId: tab_id,
          text: nb_purposes.toString(),
        });
      }
    });
  }
}

function format_date(date) {
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function update_with_consent_string_data(consentString) {
  try {
    const nbPurposes = consentString.allowedPurposeIds.length;
    const nbVendors = consentString.allowedVendorIds.length;
    const allowedPurposes = consentString.allowedPurposeIds;
    vendorListVersion = parseInt(consentString.vendorListVersion);
    if (document.title === 'Cookie Glasses') { // this part is unecessary if popup is not open
      if (consentString.allowedVendorIds.length === 0) {
        document.getElementById('show_vendors').classList.add('hidden');
      }
      document.getElementById('cmplocator_found').classList.add('hidden');
      document.getElementById('nothing_found').classList.add('hidden');
      document.getElementById('cmp_content').classList.remove('hidden');
      const cmpid = parseInt(consentString.cmpId);
      if (cmpid in cmp_names) {
        document.getElementById('cmp').textContent = cmp_names[cmpid];
      } else {
        document.getElementById('cmp').textContent = "Unknown CMP ID. Look for it on IAB Europe's list: ";
        const a = document.createElement('a');
        a.href = 'https://iabeurope.eu/cmp-list/';
        a.appendChild(document.createTextNode('https://iabeurope.eu/cmp-list/'));
        document.getElementById('cmp').appendChild(a);
      }
      document.getElementById('cmpid').textContent = ` (ID: ${consentString.cmpId})`;
      document.getElementById('nb_purposes').textContent = nbPurposes;
      const purposes = document.getElementById('purposes');
      while (purposes.firstChild) {
        purposes.removeChild(purposes.lastChild);
      }
      for (i = 0; i < nbPurposes; i++) {
        purpose_id = parseInt(consentString.allowedPurposeIds[i], 10);
        if (purpose_id >= 1 && purpose_id <= 5) {
          const br = document.createElement('br');
          purposes.appendChild(br);
          const text = document.createTextNode('- ');
          purposes.appendChild(text);
          const abbr = document.createElement('abbr');
          abbr.title = descriptionsLong[purpose_id - 1];
          const abbr_text = document.createTextNode(descriptions[purpose_id - 1]);
          abbr.appendChild(abbr_text);
          purposes.appendChild(abbr);
        }
      }
      document.getElementById('nb_vendors').textContent = nbVendors;
      document.getElementById('created').textContent = format_date(consentString.created);
      document.getElementById('last_updated').textContent = format_date(consentString.lastUpdated);
      return true;
    }
  } catch (e) {
    if (e instanceof TypeError) {
      /* if (document.title == "Cookie Glasses") {
          document.getElementById('show_invalid_cs').classList.remove('hidden');
            } */
      return false;
    }
    throw e;
  }
}

function findVendor(id, vendorList) {
  for (vendor in vendorList.vendors) {
    if (vendorList.vendors[vendor].id == id) {
      return vendorList.vendors[vendor];
    }
  }
  return null;
}

function showVendors(vendorList) {
  let vendors = '';
  const vendorNames = [];
  let id;
  // eslint-disable-next-line no-restricted-syntax
  for (id in consentString.allowedVendorIds) {
    const vendor = findVendor(consentString.allowedVendorIds[id], vendorList);
    let vendorName;
    if (vendor == null) {
      vendorName = `{Incorrect vendor, ID ${id}}`;
    } else {
      vendorName = vendor.name;
      if (vendor.purposeIds.length === 0) {
        vendorName += ' [*]';
      }
    }
    vendorNames.push(vendorName);
  }
  vendors = '\r\nVendors ([*] indicates that vendors relies on legitimates interests only):\r\n';
  let vendorName;
  // eslint-disable-next-line no-restricted-syntax
  for (vendorName in vendorNames.sort()) {
    vendors += `${vendorNames[vendorName]}\r\n`;
  }
  document.getElementById('vendors').textContent = vendors;
  document.getElementById('show_vendors').classList.add('hidden');
}

function fetchVendorList() {
  const req = new Request(`https://vendor-list.consensu.org/v${vendorListVersion}/vendor-list.json`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    redirect: 'follow',
    referrer: 'client',
  });
  console.log('fetchVendorList', req);
  fetch(req).then((response) => response.json()).then((data) => {
    const a = {};
    a[`vendorList_${vendorListVersion}`] = data;
    api.storage.local.set(a);
    showVendors(data);
  }).catch((error) => {
    console.log('Error fetching vendor list: ', error);
    // TODO: surface generic error message in pop-up
  });
}

function loadVendors() {
  const vendorListName = `vendorList_${vendorListVersion}`;
  api.storage.local.get([`vendorList_${vendorListVersion}`], (result) => {
    // document.getElementById('vendors').classList.remove('hidden');
    if (result[vendorListName] === undefined) {
      // vendorList is not in localstorage, load it from IAB's website
      document.getElementById('vendors').appendChild(document.createTextNode('Loading vendor list...'));
      fetchVendorList();
    } else {
      // vendorList is in localsstorage
      showVendors(result[vendorListName]);
    }
  });
}

if (document.getElementById('show_vendors')) {
  document.getElementById('show_vendors').onclick = loadVendors;
}

if (document.getElementById('decode_cs')) {
  document.getElementById('decode_cs').onclick = function () {
    const raw_consent_string = document.getElementById('cs_to_decode').value;
    try {
      consentString = decodeConsentString(raw_consent_string);
      update_with_consent_string_data(consentString);
      document.getElementById('show_cs').classList.add('hidden');
      document.getElementById('manual_cs').classList.remove('hidden');
      document.getElementById('decode_cs_error').classList.add('hidden');
    } catch {
      document.getElementById('decode_cs_error').classList.remove('hidden');
    }
  };
}

window.onload = function () {
  // fetchData();
};

if (document.getElementById('open_decoder')) {
  document.getElementById('open_decoder').onclick = function (e) {
    e.preventDefault();
    const decoder = document.getElementById('decoder');
    if (decoder.classList.contains('hidden')) {
      decoder.classList.remove('hidden');
      document.getElementById('details').classList.add('hidden');
    } else {
      decoder.classList.add('hidden');
    }
  };
}

if (document.getElementById('open_details')) {
  document.getElementById('open_details').onclick = function (e) {
    e.preventDefault();
    const details = document.getElementById('details');
    if (details.classList.contains('hidden')) {
      details.classList.remove('hidden');
      document.getElementById('decoder').classList.add('hidden');
    } else {
      details.classList.add('hidden');
    }
  };
}

// https://bugzilla.mozilla.org/show_bug.cgi?id=1425829#c12
async function firefoxWorkaroundForBlankPanel() {
  if (chrome != undefined || browser === undefined) {
    return;
  }
  const { id, width, height } = await browser.windows.getCurrent();
  browser.windows.update(id, {
    width: width + 1,
    height: height + 1,
  });
}
firefoxWorkaroundForBlankPanel();
