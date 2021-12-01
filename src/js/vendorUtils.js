/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* global chrome */
/* global browser */
/* eslint-disable guard-for-in */
import {
  createColumnWithChild, createLink, createColumnWithTextContent, isElementHidden,
} from './htmlUtils';

let api;
if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

function findVendor(id, vendorList) {
  return vendorList.vendors[id];
}

function getHeaderColumn(textContent) {
  const headerColumn = document.createElement('th');
  headerColumn.textContent = textContent;
  return headerColumn;
}

function addHeaders(vendorsListElement, forActiveVendors) {
  const theadElement = document.createElement('thead');
  const headerRow = document.createElement('tr');

  headerRow.appendChild(getHeaderColumn('Vendor name'));
  headerRow.appendChild(getHeaderColumn('Consent purposes'));
  headerRow.appendChild(getHeaderColumn('Leg. int. purposes'));
  headerRow.appendChild(getHeaderColumn('Special purposes'));
  headerRow.appendChild(getHeaderColumn('Uses cookies'));
  theadElement.appendChild(headerRow);

  vendorsListElement.appendChild(theadElement);
}

function getPurposesColumn(purposes, allowedPurposes) {
  const purposesColumn = document.createElement('td');
  const purposeList = purposes.filter((purpose) => allowedPurposes.includes(purpose));
  purposesColumn.textContent = purposeList.length > 0 ? purposeList : 'none';
  return purposesColumn;
}

function showVendors(vendorList, allowedVendorIds, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forActiveVendors, forceUpdate) {
  const activeVendorListElement = document.getElementById('active_vendors_list');
  const inactiveVendorListElement = document.getElementById('inactive_vendors_list');
  if ((forActiveVendors && activeVendorListElement.children.length > 0 && !forceUpdate)
    || (!forActiveVendors && inactiveVendorListElement.children.length > 0 && !forceUpdate)) {
    // we already populated the list of vendors, so no need to update
    // unless we're forcing an update
    return;
  }
  console.log('purposeConsents', purposeConsents);
  console.log('purposeLegitimateInterests', purposeLegitimateInterests);
  console.log('publisherRestrictions', publisherRestrictions);

  addHeaders(activeVendorListElement, true);
  addHeaders(inactiveVendorListElement, false);
  const activeTBodyElement = document.createElement('tbody');
  const inactiveTBodyElement = document.createElement('tbody');
  let numActive = 0;
  let numInactive = 0;
  allowedVendorIds.forEach((id) => {
    const vendor = findVendor(id, vendorList);
    console.log('vendor: ', vendor);
    if (vendor === undefined) {
      console.log(`{Incorrect vendor, ID ${id}}`);
    } else {
      const vendorName = vendor.name;
      let vendorPurposes = vendor.purposes;
      let vendorLegIntPurposes = vendor.legIntPurposes;
      const vendorFlexiblePurposes = vendor.flexiblePurposes;
      const vendorSpecialPurposes = vendor.specialPurposes;

      Array.from(publisherRestrictions.keys()).forEach((key) => {
        const publisherResVendor = publisherRestrictions.get(key);
        if (id in publisherResVendor) {
          // restrictionType meaning:
          // 0 Purpose Flatly Not Allowed by Publisher (regardless of Vendor declarations)
          // 1 Require Consent (if Vendor has declared the Purpose IDs legal basis as Legitimate Interest and flexible)
          // 2 Require Legitimate Interest (if Vendor has declared the Purpose IDs legal basis as Consent and flexible)
          const restrictionType = publisherResVendor.get(id);
          if (restrictionType === 0) {
            vendorPurposes = vendorPurposes.filter((val) => val !== key);
            vendorLegIntPurposes = vendorLegIntPurposes.filter((val) => val !== key);
          } else if (restrictionType === 1) {
            vendorLegIntPurposes = vendorLegIntPurposes.filter((val) => val !== key);
            if ((vendorFlexiblePurposes.includes(key)) && !(vendorPurposes.includes(key))) {
              vendorPurposes.add(key);
            }
          } else if (restrictionType === 2) {
            vendorPurposes = vendorPurposes.filter((val) => val !== key);
          } else {
            console.log('Error: Unkown restrictionType');
          }
        }
      });

      const validConsentPurposes = [...purposeConsents].filter((value) => vendorPurposes.includes(value));
      const validLegIntPurposes = [...purposeLegitimateInterests].filter((value) => vendorLegIntPurposes.includes(value));
      const rowItem = document.createElement('tr');
      const vendorLink = createLink(vendor.policyUrl, vendorName);
      const isInactive = validConsentPurposes.length === 0 && validLegIntPurposes.length === 0 && vendorSpecialPurposes.length === 0;

      rowItem.appendChild(createColumnWithChild(vendorLink));
      rowItem.appendChild(getPurposesColumn(vendor.purposes, validConsentPurposes));
      rowItem.appendChild(getPurposesColumn(vendor.legIntPurposes, validLegIntPurposes));
      rowItem.appendChild(createColumnWithTextContent(vendorSpecialPurposes.length > 0 ? vendorSpecialPurposes : 'none'));
      rowItem.appendChild(createColumnWithTextContent(vendor.usesCookies));

      if (isInactive) {
        numInactive += 1;
        inactiveTBodyElement.appendChild(rowItem);
      } else {
        numActive += 1;
        activeTBodyElement.appendChild(rowItem);
      }
    }
  });
  activeVendorListElement.appendChild(activeTBodyElement);
  inactiveVendorListElement.appendChild(inactiveTBodyElement);

  // update totals
  console.log('ooo numInactive', numInactive);
  document.getElementById('nb_active_vendors').textContent = numActive;
  document.getElementById('nb_inactive_vendors').textContent = numInactive;
}

function fetchVendorList(vendorListVersion, purposeConsents, purposeLegitimateInterests, publisherRestrictions, allowedVendors, forActiveVendors, forceUpdate) {
  const req = new Request(`https://vendor-list.consensu.org/v${vendorListVersion}/vendor-list.json`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    redirect: 'follow',
    referrer: 'client',
  });

  fetch(req).then((response) => response.json()).then((data) => {
    const a = {};
    a[`vendorList_${vendorListVersion}`] = data;
    api.storage.local.set(a);
    showVendors(data, allowedVendors, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forActiveVendors, forceUpdate);
  }).catch((error) => {
    console.log('Error fetching vendor list: ', error);
    // TODO: surface generic error message in pop-up
  });
}

function setUnion(setA, setB) {
  const _union = new Set(setA);
  for (const elem of setB) {
    _union.add(elem);
  }
  return _union;
}

function loadVendors(tcData, vendorListVersion, forActiveVendors, forceUpdate) {
  const allowedVendors = setUnion(tcData.vendorConsents.set_, tcData.vendorLegitimateInterests.set_);
  const purposeConsents = tcData.purposeConsents.set_;
  const purposeLegitimateInterests = tcData.purposeLegitimateInterests.set_;
  const publisherRestrictions = tcData.publisherRestrictions.map;
  const vendorListName = `vendorList_${vendorListVersion}`;
  api.storage.local.get([`vendorList_${vendorListVersion}`], (result) => {
    if (result[vendorListName] === undefined) {
      // vendorList is not in localstorage, load it from IAB's website
      fetchVendorList(vendorListVersion, purposeConsents, purposeLegitimateInterests, publisherRestrictions, allowedVendors, forActiveVendors, forceUpdate);
    } else {
      // vendorList is in local storage
      showVendors(result[vendorListName], allowedVendors, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forActiveVendors, forceUpdate);
    }
  });
}

export default function handleVendors(tcData, vendorListVersion, forActiveVendors, forceUpdate) {
  const buttonId = forActiveVendors ? 'show_active_vendors' : 'show_inactive_vendors';
  const containerId = forActiveVendors ? 'active_vendors_container' : 'inactive_vendors_container';
  const otherContainerId = forActiveVendors ? 'inactive_vendors_container' : 'active_vendors_container';

  if (document.getElementById(buttonId)) {
    const showVendorsButton = document.getElementById(buttonId);
    const vendorsContainerElement = document.getElementById(containerId);
    showVendorsButton.onclick = () => {
      if (isElementHidden(vendorsContainerElement)) {
        vendorsContainerElement.classList.remove('hidden');
        loadVendors(tcData, vendorListVersion, forActiveVendors, forceUpdate);
        showVendorsButton.innerText = 'Hide';
        showVendorsButton.classList.add('button_hide');

        // hide other vendor list
        document.getElementById(otherContainerId).classList.add('hidden');
        document.getElementById(buttonId).innerText = 'Show vendors';
        document.getElementById(buttonId).classList.remove('button_hide');
      } else {
        showVendorsButton.innerText = 'Show vendors';
        vendorsContainerElement.classList.add('hidden');
        showVendorsButton.classList.remove('button_hide');
      }
    };
  }
}
