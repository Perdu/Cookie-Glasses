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

function showVendors(vendorList, allowedVendorIds, forPurposes) {
  const vendorsListElement = document.getElementById(forPurposes ? 'purpose_vendors_list' : 'legitimate_interests_vendors_list');
  allowedVendorIds.forEach((id) => {
    const vendor = findVendor(id, vendorList);
    let vendorName;
    if (vendor === undefined) {
      vendorName = `{Incorrect vendor, ID ${id}}`;
    } else {
      vendorName = vendor.name;
      const listItem = document.createElement('li');
      const vendorLink = document.createElement('a');
      vendorLink.href = vendor.policyUrl;
      vendorLink.target = '_blank';
      vendorLink.innerText = vendorName;

      if (vendor.purposes.length === 0) {
        vendorName += ' [*]';
      }
      listItem.appendChild(vendorLink);
      vendorsListElement.appendChild(listItem);
    }
  });
}

function fetchVendorList(vendorListVersion, allowedVendors) {
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
    showVendors(data, allowedVendors);
  }).catch((error) => {
    console.log('Error fetching vendor list: ', error);
    // TODO: surface generic error message in pop-up
  });
}

function loadVendors(vendorConsents, vendorListVersion, forPurposes) {
  const allowedVendors = vendorConsents.set_;
  const vendorListName = `vendorList_${vendorListVersion}`;
  api.storage.local.get([`vendorList_${vendorListVersion}`], (result) => {
    if (result[vendorListName] === undefined) {
      // vendorList is not in localstorage, load it from IAB's website
      document.getElementById('vendors_container').appendChild(document.createTextNode('Loading vendor list...'));
      fetchVendorList(vendorListVersion, allowedVendors);
    } else {
      // vendorList is in locals storage
      showVendors(result[vendorListName], allowedVendors, forPurposes);
    }
  });
}

export default function handleVendors(vendorConsents, vendorListVersion, forConsent) {
  const buttonId = forConsent ? 'show_vendor_purposes' : 'show_vendor_legitimate_interests';
  const containerId = forConsent ? 'purposes_vendors_container' : 'legitimate_interests_vendors_container';

  if (document.getElementById(buttonId)) {
    const showVendorsButton = document.getElementById(buttonId);
    const vendorsContainerElement = document.getElementById(containerId);
    showVendorsButton.onclick = () => {
      console.log('clicking!', vendorsContainerElement);

      if (vendorsContainerElement.classList.contains('hidden')) {
        vendorsContainerElement.classList.remove('hidden');
        loadVendors(vendorConsents, vendorListVersion, forConsent);
        showVendorsButton.innerText = 'Hide';
      } else {
        showVendorsButton.innerText = 'Show vendors';
        vendorsContainerElement.classList.add('hidden');
      }
    };
  }
}
