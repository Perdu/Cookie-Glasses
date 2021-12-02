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

function addHeaders(vendorsListElement) {
  const theadElement = document.createElement('thead');
  const headerRow = document.createElement('tr');

  headerRow.appendChild(getHeaderColumn('Vendor name'));
  headerRow.appendChild(getHeaderColumn('Consent purposes'));
  headerRow.appendChild(getHeaderColumn('Leg. int. purposes'));
  headerRow.appendChild(getHeaderColumn('Special purposes'));
  theadElement.appendChild(headerRow);

  vendorsListElement.appendChild(theadElement);
}

function getPurposesColumn(purposes, allowedPurposes) {
  const purposesColumn = document.createElement('td');
  const purposeList = purposes.filter((purpose) => allowedPurposes.includes(purpose));
  purposesColumn.textContent = purposeList.length > 0 ? purposeList : 'none';
  return purposesColumn;
}

function showVendors(vendorList, allowedVendorIds, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forceUpdate) {
  const vendorListElement = document.getElementById('active_vendors_list');
  if (vendorListElement.children.length > 0 && !forceUpdate) {
    // we already populated the list of vendors, so no need to update
    // unless we're forcing an update
    return;
  }
  console.log('purposeConsents', purposeConsents);
  console.log('purposeLegitimateInterests', purposeLegitimateInterests);
  console.log('publisherRestrictions', publisherRestrictions);

  addHeaders(vendorListElement);
  const activeTBodyElement = document.createElement('tbody');
  let numActive = 0;
  let numInactive = 0;
  let numFeature1 = 0;
  let numFeature2 = 0;
  let numFeature3 = 0;
  let numSpecialFeature1 = 0;
  let numSpecialFeature2 = 0;
  allowedVendorIds.forEach((id) => {
    const vendor = findVendor(id, vendorList);
    console.log('vendor:', vendor);
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

      // check features
      if (vendor.features.includes(1)) {
        numFeature1 += 1;
      } else if (vendor.features.includes(2)) {
        numFeature2 += 1;
      } else if (vendor.features.includes(3)) {
        numFeature3 += 1;
      }

      // check special features
      if (vendor.specialFeatures.includes(1)) {
        numSpecialFeature1 += 1;
      } else if (vendor.specialFeatures.includes(2)) {
        numSpecialFeature2 += 1;
      }

      const validConsentPurposes = [...purposeConsents].filter((value) => vendorPurposes.includes(value));
      const validLegIntPurposes = [...purposeLegitimateInterests].filter((value) => vendorLegIntPurposes.includes(value));
      const isInactive = validConsentPurposes.length === 0 && validLegIntPurposes.length === 0 && vendorSpecialPurposes.length === 0;
      const rowItem = document.createElement('tr');
      const vendorLink = createLink(vendor.policyUrl, isInactive ? `😴 ${vendorName}` : vendorName);

      rowItem.appendChild(createColumnWithChild(vendorLink));
      rowItem.appendChild(getPurposesColumn(vendor.purposes, validConsentPurposes));
      rowItem.appendChild(getPurposesColumn(vendor.legIntPurposes, validLegIntPurposes));
      rowItem.appendChild(createColumnWithTextContent(vendorSpecialPurposes.length > 0 ? vendorSpecialPurposes : 'none'));
      activeTBodyElement.appendChild(rowItem);

      if (isInactive) {
        numInactive += 1;
      } else {
        numActive += 1;
      }
    }
  });
  vendorListElement.appendChild(activeTBodyElement);

  // update totals
  document.getElementById('nb_active_vendors').textContent = numActive;
  document.getElementById('nb_inactive_vendors').textContent = numInactive;
  document.getElementById('nb_vendors_feature_1').textContent = numFeature1;
  document.getElementById('nb_vendors_feature_2').textContent = numFeature2;
  document.getElementById('nb_vendors_feature_3').textContent = numFeature3;
  document.getElementById('nb_vendors_special_feature_1').textContent = numSpecialFeature1;
  document.getElementById('nb_vendors_special_feature_2').textContent = numSpecialFeature2;
}

function fetchVendorList(vendorListVersion, purposeConsents, purposeLegitimateInterests, publisherRestrictions, allowedVendors, forceUpdate) {
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
    showVendors(data, allowedVendors, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forceUpdate);
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

function loadVendors(tcData, vendorListVersion, forceUpdate) {
  const allowedVendors = setUnion(tcData.vendorConsents.set_, tcData.vendorLegitimateInterests.set_);
  const purposeConsents = tcData.purposeConsents.set_;
  const purposeLegitimateInterests = tcData.purposeLegitimateInterests.set_;
  const publisherRestrictions = tcData.publisherRestrictions.map;
  const vendorListName = `vendorList_${vendorListVersion}`;
  api.storage.local.get([`vendorList_${vendorListVersion}`], (result) => {
    if (result[vendorListName] === undefined) {
      // vendorList is not in localstorage, load it from IAB's website
      fetchVendorList(vendorListVersion, purposeConsents, purposeLegitimateInterests, publisherRestrictions, allowedVendors, forceUpdate);
    } else {
      // vendorList is in local storage
      showVendors(result[vendorListName], allowedVendors, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forceUpdate);
    }
  });
}

function setUpFeatureButtons(buttonId, featureListId) {
  const showButton = document.getElementById(buttonId);
  const listElement = document.getElementById(featureListId);

  showButton.onclick = () => {
    if (isElementHidden(listElement)) {
      listElement.classList.remove('hidden');
      showButton.innerText = '▵';
    } else {
      listElement.classList.add('hidden');
      showButton.innerText = '▽';
    }
  };
}

export default function handleVendors(tcData, vendorListVersion, forceUpdate) {
  const buttonId = 'show_vendors';
  const containerId = 'active_vendors_container';
  loadVendors(tcData, vendorListVersion, forceUpdate);

  const showVendorsButton = document.getElementById(buttonId);
  const vendorsContainerElement = document.getElementById(containerId);
  showVendorsButton.onclick = () => {
    if (isElementHidden(vendorsContainerElement)) {
      vendorsContainerElement.classList.remove('hidden');
      showVendorsButton.innerText = 'Hide';
      showVendorsButton.classList.add('button_hide');
    } else {
      showVendorsButton.innerText = 'Show vendors';
      vendorsContainerElement.classList.add('hidden');
      showVendorsButton.classList.remove('button_hide');
    }
  };

  // set up feature b uttons
  setUpFeatureButtons('show_feature_button', 'feature_list');
  setUpFeatureButtons('show_special_feature_button', 'special_feature_list');
}
