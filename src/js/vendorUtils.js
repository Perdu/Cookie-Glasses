/* global chrome */
/* global browser */
/* eslint-disable guard-for-in */
let api;
if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

export function findVendor(id, vendorList) {
  return vendorList.vendors[id];
}

export function showVendors(vendorList, allowedVendorIds) {
  const vendorsListElement = document.getElementById('vendors_list');
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

export function fetchVendorList(vendorListVersion, allowedVendors) {
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
