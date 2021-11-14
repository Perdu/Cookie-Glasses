/* eslint-disable no-loop-func */
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
import handleVendors from '../js/vendorUtils';

const VENDOR_LIST_VERSION = 2;
let api;
if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

const tz = Intl.DateTimeFormat().resolvedOptions().locale;
const CHECK_TAB_STORAGE_RETRIES = 3;

function hideElement(elementId) {
  document.getElementById(elementId).classList.add('hidden');
}

function showHiddenElement(elementId) {
  document.getElementById(elementId).classList.remove('hidden');
}

function handleCmpLocatorFound(cmpLocatorFound) {
  try {
    if (cmpLocatorFound === true) {
      hideElement('nothing_found');
      showHiddenElement('cmplocator_found');
    } else {
      showHiddenElement('nothing_found');
      hideElement('cmplocator_found');
    }
  } catch {
    // popup not open
  }
}

function handleGdprApplies(gdprApplies) {
  try {
    if (gdprApplies === true) {
      hideElement('gdpr_applies_false');
      showHiddenElement('cmplocator_found');
    } else {
      showHiddenElement('gdpr_applies_false');
      hideElement('cmplocator_found');
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
    document.getElementById('cmp').classList.add('identified_cmp');
  } else {
    document.getElementById('cmp').textContent = `Unknown CMP ID ${cmpId}. Search for it on the cmp-list: `;
    const a = document.createElement('a');
    a.href = 'https://iabeurope.eu/cmp-list/';
    a.target = '_blank';
    a.appendChild(document.createTextNode('https://iabeurope.eu/cmp-list/'));
    document.getElementById('cmp').appendChild(a);
  }
}

function showNumVendors(vendorConsents) {
  document.getElementById('nb_vendors').textContent = vendorConsents.set_.size;
}

function showPurposes(purposeConsents) {
  document.getElementById('nb_purposes').textContent = purposeConsents.set_.size;
  [...Array(10).keys()].map((id) => {
    if (purposeConsents.set_.has(id + 1)) {
      document.getElementById(`purpose-${id + 1}`).classList.add('purpose-consented-item');
      return true;
    }
    document.getElementById(`purpose-${id + 1}`).classList.add('purpose-not-consented-item');
    return false;
  });
}

function formatDate(date) {
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatIntlDate(date) {
  return new Intl.DateTimeFormat(tz, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

function handleLegitimateInterests(vendorLegitimateInterests) {
  document.getElementById('nb_legitimate_interests').textContent = vendorLegitimateInterests.set_.size;
}

function showTimestamps(createdAt, lastUpdated, lastFetched) {
  document.getElementById('created').textContent = formatDate(createdAt);
  document.getElementById('last_updated').textContent = formatDate(lastUpdated);
  document.getElementById('last_fetched').textContent = formatIntlDate(lastFetched);
}

function handleTCData(data, timestampTcDataLoaded) {
  showCmp(data.cmpId_);
  showNumVendors(data.vendorConsents);
  showPurposes(data.purposeConsents);
  showTimestamps(data.created, data.lastUpdated, timestampTcDataLoaded);

  // handle vendor buttons
  handleVendors(data.vendorConsents, VENDOR_LIST_VERSION);
  handleLegitimateInterests(data.vendorLegitimateInterests);
}

function getActiveTabStorage() {
  let count = 0;
  function loop() {
    count += 1;
    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id;
      console.log('active tab id', tabs[0].id);

      api.storage.local.get([String(activeTabId)], (result) => {
        const data = result[activeTabId];
        console.log('data from storage', data);
        if (data === undefined) {
          if (count <= CHECK_TAB_STORAGE_RETRIES) {
            document.getElementById('nothing_found').classList.add('hidden');
            document.getElementById('error_fetching_retry').classList.remove('hidden');
            setTimeout(() => { console.log(`Could not find TCF data in local storage, try ${count}/${CHECK_TAB_STORAGE_RETRIES}`); loop(); }, 1000);
          } else {
            document.getElementById('nothing_found').classList.add('hidden');
            document.getElementById('error_fetching_retry').classList.add('hidden');
            document.getElementById('error_fetching').classList.remove('hidden');
            return false;
          }
        }

        // we've confirmed if the tcfapiLocator has been found
        if (data.tcfapiLocatorFound !== undefined) {
          handleCmpLocatorFound(data.tcfapiLocatorFound);
        } else {
          return true;
        }

        if (data.gdprApplies !== undefined && data.tcfapiLocatorFound) {
          handleGdprApplies(data.gdprApplies);
        }

        // tcfapiLocator has been found & received tcString
        if (data.tcfapiLocatorFound === true && data.tcString !== undefined) {
        // no longer need to show found message
          hideElement('cmplocator_found');
          showHiddenElement('cmp_content');
          showTCString(data.tcString);

          const decodedString = TCString.decode(data.tcString);
          console.log('decoded string', decodedString);
          handleTCData(decodedString, data.timestampTcDataLoaded);
        }
      });
      return true;
    });
  }
  loop();
}

/**
 * Prunes tab storage, called when the popup is opened
 * 1. If there are over 200 keys in local storage
 * 2. Check if the key is something we set (ie from cookie glasses)
 * 3. If the storage item is from cookie glasses and is over 12 hours old, remove it from storage
 */
function pruneTabStorage() {
  chrome.storage.local.get(null, (result) => {
    console.log('Pruning local tabs storage');
    const keys = Object.keys(result);
    if (keys.length > 200) {
      keys.map((key) => {
        const item = result[key];
        if (item.tcfapiLocatorFound !== undefined
          && item.gdprApplies !== undefined
          && item.timestamp !== undefined) {
          if (item.timestamp < Date.now() - 43200000) {
            chrome.storage.local.remove(key);
          }
        }
        return true;
      });
    }
  });
}

if (document.getElementById('show_purposes')) {
  const purposesElement = document.getElementById('purposes_list');
  const showPurposesButton = document.getElementById('show_purposes');
  showPurposesButton.onclick = () => {
    if (purposesElement.classList.contains('hidden')) {
      showPurposesButton.innerText = 'Hide';
      purposesElement.classList.remove('hidden');
    } else {
      showPurposesButton.innerText = 'Show purposes';
      purposesElement.classList.add('hidden');
    }
  };
}

pruneTabStorage();
getActiveTabStorage();

// ----------------------------- OLD LOGIC -----------------------------
if (document.getElementById('decode_cs')) {
  document.getElementById('decode_cs').onclick = function () {
    const raw_consent_string = document.getElementById('cs_to_decode').value;
    try {
      // const consentString = decodeConsentString(raw_consent_string);
      // update_with_consent_string_data(consentString);
      document.getElementById('show_cs').classList.add('hidden');
      document.getElementById('manual_cs').classList.remove('hidden');
      document.getElementById('decode_cs_error').classList.add('hidden');
    } catch {
      document.getElementById('decode_cs_error').classList.remove('hidden');
    }
  };
}

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
