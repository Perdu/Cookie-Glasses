/* eslint-disable no-underscore-dangle */
import {
  createColumnWithTextContent, isElementHidden,
} from './htmlUtils';

// purposes as defined by the TCF policy: https://iabeurope.eu/iab-europe-transparency-consent-framework-policies/
const PURPOSES = {
  1: {
    title: 'Store and/or access information on a device',
    description: 'Cookies, device identifiers, or other information can be stored or accessed on your device for the purposes presented to you.',
  },
  2: {
    title: 'Select basic ads',
    description: 'Ads can be shown to you based on the content you’re viewing, the app you’re using, your approximate location, or your device type.',
  },
  3: {
    title: 'Create a personalised ads profile',
    description: 'A profile can be built about you and your interests to show you personalised ads that are relevant to you',
  },
  4: {
    title: 'Select personalised ads',
    description: 'Personalised ads can be shown to you based on a profile about you ads that are relevant to you.',
  },
  5: {
    title: 'Create a personalised content profile',
    description: 'A profile can be built about you and your interests to show you personalised content that is relevant to you.',
  },
  6: {
    title: 'Select personalised content',
    description: 'Personalised content can be shown to you based on a profile about you.',
  },
  7: {
    title: 'Measure ad performance',
    description: 'The performance and effectiveness of ads that you see or interact with can be measured.',
  },
  8: {
    title: 'Measure content performance',
    description: 'The performance and effectiveness of content that you see or interact with can be measured. be measured.',
  },
  9: {
    title: 'Apply market research to generate audience insights',
    description: 'Market research can be used to learn more about the audiences who visit sites/apps and view ads.',
  },
  10: {
    title: 'Develop and improve products',
    description: 'Your data can be used to improve existing systems and software, and to develop new products',
  },
};

const SPECIAL_PURPOSES = {
  1: {
    title: 'Ensure security, prevent fraud, and debug',
    description: 'Your data can be used to monitor for and prevent fraudulent activity, and ensure systems and processes work properly and securely.',
  },
  2: {
    title: 'Technically deliver ads or content',
    description: 'Your device can receive and send information that allows you to see and interact with ads and content',
  },
};

function updatePurposes(tcData) {
  const purposeListBodyElement = document.getElementById('purpose_list_body');

  const {
    purposeConsents,
    purposeLegitimateInterests: purposeLegitInt,
  } = tcData;

  // create row for each purpose
  Object.entries(PURPOSES).map((p) => {
    const row = document.createElement('tr');
    const purposeId = parseInt(p[0], 10);
    const purpose = p[1];
    row.appendChild(createColumnWithTextContent(purposeId));
    row.appendChild(createColumnWithTextContent(purpose.title));
    row.appendChild(createColumnWithTextContent(purpose.description));

    // check if user has allowed purpose via consent or legitimate interest
    row.appendChild(createColumnWithTextContent(purposeConsents.set_.has(purposeId) ? '✅' : '❌', 'purpose-column'));
    row.appendChild(createColumnWithTextContent(purposeLegitInt.set_.has(purposeId) ? '✅' : '❌', 'purpose-column'));

    purposeListBodyElement.appendChild(row);
    return true;
  });

  // add special purposes
  Object.entries(SPECIAL_PURPOSES).map((p) => {
    const row = document.createElement('tr');
    const purposeId = parseInt(p[0], 10);
    const purpose = p[1];
    row.appendChild(createColumnWithTextContent(`${purposeId}⭐`));
    row.appendChild(createColumnWithTextContent(purpose.title));
    row.appendChild(createColumnWithTextContent(purpose.description));

    // users cannot opt out of special purposes
    row.appendChild(createColumnWithTextContent('n/a', 'purpose-column'));
    row.appendChild(createColumnWithTextContent('✅', 'purpose-column'));

    purposeListBodyElement.appendChild(row);
    return true;
  });
}

export default function handlePurposes(tcData) {
  const buttonId = 'show_purposes_button';
  const containerId = 'purposes_list_container';

  // update totals
  document.getElementById('nb_purposes').textContent = tcData.purposeConsents.set_.size;
  document.getElementById('nb_legitimate_interests').textContent = tcData.purposeLegitimateInterests.set_.size;
  updatePurposes(tcData);

  const showPurposesButton = document.getElementById(buttonId);
  const purposesContainerElement = document.getElementById(containerId);
  showPurposesButton.onclick = () => {
    if (isElementHidden(purposesContainerElement)) {
      purposesContainerElement.classList.remove('hidden');
      showPurposesButton.innerText = 'Hide';
      showPurposesButton.classList.add('button_hide');
    } else {
      showPurposesButton.innerText = 'Show purposes';
      purposesContainerElement.classList.add('hidden');
      showPurposesButton.classList.remove('button_hide');
    }
  };
}
