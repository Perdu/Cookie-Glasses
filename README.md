# Cookie Glasses
This browser extension shows you whether consent registered by cookie banners of IAB Europe's Transparency &amp; Consent Framework corresponds to your choice

Update September 2020: CMPs switched to TCFv2 in August 2020. This extension only handles TCFv1 and is therefore obsolete unless work is done to integrate [pull request 10](https://github.com/Perdu/Cookie-Glasses/pull/10). Project is currently abandoned.

## Introduction

In the paper [Do Cookie Banners Respect my Choice? Measuring Legal Compliance of Banners from IAB Europe's Transparency and Consent Framework](https://arxiv.org/abs/1911.09964), we show that Consent Management Providers (CMPs) of IAB Europe's Transparency & Consent Framework (TCF) do not always respect user's choice. This extension allows you to verify that your consent is stored appropriately.

This extension for Firefox and Chrome queries CMPs of IAB Europe's TCF in the same position as a third-party advertiser, making it possible to see consent set by CMPs in real time.
In other words, you can see whether consent registered by cookie banners is actually the consent you gave.
Will only work with cookie banners of IAB Europe's TCF.

![User interface of the extension](extension_popup.png?raw=true "User interface")

We also added a functionality to manually decode a so-called "consent string" of the framework.

Author: Célestin Matte (Université Côte d'Azur, Inria, France)

This is a research project made at Inria. Stage: complete. TCFv2 support might be added later.

## Install

You can either install the extension from browsers' addon stores (simple, easy), or manually install it from source.

### Install from addon store

Chrome / Chromium : https://chrome.google.com/webstore/detail/cookie-glasses/gncnjghkclkhpkfhghcbobednpchjifk

Firefox: https://addons.mozilla.org/fr/firefox/addon/cookie-glasses/

### Manual install from source:

The extension has been tested on Firefox, Chromium and Firefox mobile.

#### Chrome / Chromium

1. Download the ZIP file of Cookie Glasses on your computer.
![Location of the zip file](https://camo.githubusercontent.com/71c8e3ec5ddbd2cac3b1d6469311f6bbf26c6465/68747470733a2f2f692e696d6775722e636f6d2f47784f6d6a46682e706e67)
2. Unzip the ZIP file you just downloaded on your computer.
3. Open Chrome and enter the following URL in your tab bar: chrome://extensions/
4. Enable Developer mode in the top right.
5. Click "Load unpacked"
6. Choose the `Cookie-Glasse-master` folder on your computer.
7. Visit websites implementing the Transparency & Consent Framework
8. Enjoy detecting violations!

#### Firefox

On Firefox, out-of-store addons can only be loaded for the duration of the session (you will have to redo these steps if you close your browser).

1. Download the ZIP file of Cookie Glasses on your computer.
![Location of the zip file](https://camo.githubusercontent.com/71c8e3ec5ddbd2cac3b1d6469311f6bbf26c6465/68747470733a2f2f692e696d6775722e636f6d2f47784f6d6a46682e706e67)
2. Unzip the ZIP file you just downloaded on your computer.
3. Open Firefox and enter the following URL in your tab bar: about:debugging#/runtime/this-firefox
4. Click "Load temporary addon"
5. Choose the `manifest.json` file in the `Cookie-Glasse-master` folder on your computer.
6. Visit websites implementing the Transparency & Consent Framework
7. Enjoy detecting violations!

## Limitations

As explained in the paper, there are two ways for advertisers to query the CMP:
1. through a direct call to the __cmp() function if they are in a first-party position,
2. through a postMessage sent to the __cmpLocator iframe if they are in a third-party position.

Because of the security mechanisms of browsers extensions, Cookie Glasses can only use the second method. According to our measurement, this method is working on 79% of websites using the TCF.

If you want to see consent on the remaining 21% of websites, here's a manual workaround:
1. Open the developer console (ctrl+maj+i)
2. Run the following code: `__cmp("getConsentData", null, function(v, success) { console.log(v); });`
3. If you obtain a response, copy-paste the string in the "consentData" field in Cookie Glasses' popup's "decode consent string" field and click on "decode".

For now, the extension does not display the global shared cookie (which is a cookie storing consent, readable and writable by all CMPs of the framework).

## Privacy Policy
Cookie Glasses does not handle any personal information.
Cookie Glasses only processes consent information from IAB Europe's Transparency and Consent Framework (TCF) locally, and does not send any information to a distant server.
