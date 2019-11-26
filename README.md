# Cookie Glasses
Browser extension showing consent registered by cookie banners of IAB Europe's Transparency &amp; Consent Framework

## Introduction

In the paper [Do Cookie Banners Respect my Choice? Measuring Legal Compliance of Banners from IAB Europe's Transparency and Consent Framework](https://arxiv.org/abs/1911.09964), we show that Consent Management Providers (CMPs) of IAB Europe's Transparency & Consent Framework (TCF) do not always respect user's choice. This extension allows users to verify that their consent is stored appropriately by themselves.

This extension for Firefox and Chrome queries CMPs of IAB Europe's TCF in the same position as a third-party advertiser, making it possible to see consent set by CMPs in real time.
In other words, you can see whether consent registered by cookie banners is actually the consent you gave.
Will only work with cookie banners of IAB Europe's TCF.

We also added a functionality to manually decode a so-called "consent string" of the framework.

Author: Célestin Matte (Université Côte d'Azur, Inria, France)

## Install

The extension is currently under review for being published to Firefox's addons store, and will also be published to Chrome's store. But for the moment, you have to install it manually.
The extension has been tested on Firefox, Chromium and Firefox mobile.

### Chrome / Chromium

1. Download the folder "cookie_glasses" on your computer.
2. Go to chrome://extensions/ and enable Developer mode in the top right.
3. In chrome://extensions/, click "Load unpacked"
4. Choose the folder "cookie_glasses" on your computer.
5. Visit websites implementing the Transparency & Consent Framework
6. Enjoy detecting violations!

### Firefox

On Firefox, out-of-store addons can only be loaded for the duration of the session (you will have to redo these steps if you close your browser).

1. Download the folder "cookie_glasses" on your computer.
2. Go to about:debugging#/runtime/this-firefox
3. Click "Load temporary addon"
4. Choose the "manifest.json" file in the "cookie_glasses" folder on your computer.
5. Visit websites implementing the Transparency & Consent Framework
6. Enjoy detecting violations!

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
