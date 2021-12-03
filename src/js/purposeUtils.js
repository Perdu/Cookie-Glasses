/* eslint-disable no-underscore-dangle */
import {
  createColumnWithTextContent, isElementHidden,
} from './htmlUtils';

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

  Object.entries(PURPOSES).map((p) => {
    const row = document.createElement('tr');
    const purposeId = parseInt(p[0], 10);
    const purpose = p[1];
    row.appendChild(createColumnWithTextContent(purposeId));
    row.appendChild(createColumnWithTextContent(purpose.title));
    row.appendChild(createColumnWithTextContent(purpose.description));
    row.appendChild(createColumnWithTextContent(purposeConsents.set_.has(purposeId) ? '✅' : '❌', 'purpose-column'));
    row.appendChild(createColumnWithTextContent(purposeLegitInt.set_.has(purposeId) ? '✅' : '❌', 'purpose-column'));

    purposeListBodyElement.appendChild(row);
    return true;
  });

  Object.entries(SPECIAL_PURPOSES).map((p) => {
    const row = document.createElement('tr');
    const purposeId = parseInt(p[0], 10);
    const purpose = p[1];
    row.appendChild(createColumnWithTextContent(`${purposeId}⭐`));
    row.appendChild(createColumnWithTextContent(purpose.title));
    row.appendChild(createColumnWithTextContent(purpose.description));
    row.appendChild(createColumnWithTextContent('n/a', 'purpose-column'));
    row.appendChild(createColumnWithTextContent('✅', 'purpose-column'));

    purposeListBodyElement.appendChild(row);
    return true;
  });
}

export default function handlePurposes(tcData) {
  const buttonId = 'show_purposes_button';
  const containerId = 'purposes_list_container';
  updatePurposes(tcData);

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
}
