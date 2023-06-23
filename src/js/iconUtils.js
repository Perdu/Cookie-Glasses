/* global chrome */
/* global browser */
import greenIcon19 from '../button/19_green.png';
import greenIcon38 from '../button/38_green.png';
import redIcon19 from '../button/19_red.png';
import redIcon38 from '../button/38_red.png';
import neutralIcon19 from '../button/19.png';
import neutralIcon38 from '../button/38.png';

export const ICON_NEUTRAL = 'neutral';
export const ICON_RED = 'red';
export const ICON_GREEN = 'green';

let api;
if (chrome === undefined) {
  api = browser;
} else {
  api = chrome;
}

export function setIconBadgeText(tabId, text) {
  api.browserAction.setBadgeText({
    tabId,
    text,
  });
}

export function setIcon(activeTabId, iconType) {
  let icon19 = neutralIcon19;
  let icon38 = neutralIcon38;

  switch (iconType) {
    case ICON_RED:
      icon19 = redIcon19;
      icon38 = redIcon38;
      break;
    case ICON_GREEN:
      icon19 = greenIcon19;
      icon38 = greenIcon38;
      break;
    default:
      break;
  }

  api.browserAction.setIcon({
    tabId: activeTabId,
    path: {
      19: icon19,
      38: icon38,
    },
  });
}

export function updateIcon(
  numConsentPurposes,
  numConsentVendors,
  numLegitimateInterestPurposes,
  numLegitimateInterestVendors,
  tabId,
) {
  if (numConsentPurposes * numConsentVendors === 0
      && numLegitimateInterestPurposes * numLegitimateInterestVendors === 0) {
    setIcon(tabId, ICON_GREEN);
  } else {
    setIcon(tabId, ICON_RED);
  }

  setIconBadgeText(tabId, (numConsentPurposes + numLegitimateInterestPurposes).toString());
}
