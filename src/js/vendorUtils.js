/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* global chrome */
/* global browser */
/* eslint-disable guard-for-in */
let api;
if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

function findVendor(id, vendorList) {
  return vendorList.vendors[id];
}

function showVendors(vendorList, allowedVendorIds, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forPurposes, forceUpdate) {
  const vendorsListElement = document.getElementById(forPurposes ? 'purpose_vendors_list' : 'legitimate_interests_vendors_list');
  if (vendorsListElement.children.length > 0 && !forceUpdate) {
    // we already populated the list of vendors, so no need to update
    // unless we're forcing an update
    return;
  }
  console.log('purposeConsents', purposeConsents);
  console.log('purposeLegitimateInterests', purposeLegitimateInterests);
  console.log('publisherRestrictions', publisherRestrictions);
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
      const vendorUsesCookies = vendor.usesCookies;

      Array.from(publisherRestrictions.keys()).forEach((key) => {
        const publisherResVendor = publisherRestrictions.get(key);
        if (id in publisherResVendor) {
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

      const validPurposes = [...purposeConsents].filter((value) => vendorPurposes.includes(value));
      const validLegIntPurposes = [...purposeLegitimateInterests].filter((value) => vendorLegIntPurposes.includes(value));
      const listItem = document.createElement('li');
      const vendorLink = document.createElement('a');
      vendorLink.href = vendor.policyUrl;
      vendorLink.target = '_blank';
      vendorLink.innerText = vendorName;

      listItem.appendChild(vendorLink);
      vendorsListElement.appendChild(listItem);
    }
  });
}

function fetchVendorList(vendorListVersion, purposeConsents, purposeLegitimateInterests, publisherRestrictions, allowedVendors, forPurposes, forceUpdate) {
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
    showVendors(data, allowedVendors, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forPurposes, forceUpdate);
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

function loadVendors(
  tcData, vendorListVersion, vendorsContainerElement, forPurposes, forceUpdate,
) {
  const allowedVendors = setUnion(tcData.vendorConsents.set_, tcData.vendorLegitimateInterests.set_);
  const purposeConsents = tcData.purposeConsents.set_;
  const purposeLegitimateInterests = tcData.purposeLegitimateInterests.set_;
  const publisherRestrictions = tcData.publisherRestrictions.map;
  const vendorListName = `vendorList_${vendorListVersion}`;
  api.storage.local.get([`vendorList_${vendorListVersion}`], (result) => {
    if (result[vendorListName] === undefined) {
      // vendorList is not in localstorage, load it from IAB's website
      fetchVendorList(vendorListVersion, purposeConsents, purposeLegitimateInterests, publisherRestrictions, allowedVendors, forPurposes, forceUpdate);
    } else {
      // vendorList is in local storage
      showVendors(result[vendorListName], allowedVendors, purposeConsents, purposeLegitimateInterests, publisherRestrictions, forPurposes, forceUpdate);
    }
  });
}

export default function handleVendors(tcData, vendorListVersion, forConsent, forceUpdate) {
  const buttonId = forConsent ? 'show_vendor_consents' : 'show_vendor_legitimate_interests';
  const containerId = forConsent ? 'consents_vendors_container' : 'legitimate_interests_vendors_container';
  const purposesListId = forConsent ? 'purposes_list' : 'legitimate_interests_list';
  const showPurposesButtonId = forConsent ? 'show_consents' : 'show_legitimate_interests';

  if (document.getElementById(buttonId)) {
    const showVendorsButton = document.getElementById(buttonId);
    const vendorsContainerElement = document.getElementById(containerId);
    showVendorsButton.onclick = () => {
      if (vendorsContainerElement.classList.contains('hidden')) {
        vendorsContainerElement.classList.remove('hidden');
        loadVendors(tcData, vendorListVersion, vendorsContainerElement,
          forConsent, forceUpdate);
        showVendorsButton.innerText = 'Hide';
        showVendorsButton.classList.add('button_hide');

        // hide purposes list
        document.getElementById(purposesListId).classList.add('hidden');
        document.getElementById(showPurposesButtonId).innerText = 'Show purposes';
        document.getElementById(showPurposesButtonId).classList.remove('button_hide');
      } else {
        showVendorsButton.innerText = 'Show vendors';
        vendorsContainerElement.classList.add('hidden');
        showVendorsButton.classList.remove('button_hide');
      }
    };
  }
}
