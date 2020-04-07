var api;
if (chrome == undefined) {
    api = browser;
} else {
    api = chrome;
}

var cmplocator_found = false;

var descriptions = ["Information storage and access", "Personalisation", "Ad selection, delivery, reporting", "Content selection, delivery, reporting", "Measurement"];
var descriptions_long = ["The storage of information, or access to information that is already stored, on your device such as advertising identifiers, device identifiers, cookies, and similar technologies.", "The collection and processing of information about your use of this service to subsequently personalise advertising and/or content for you in other contexts, such as on other websites or apps, over time. Typically, the content of the site or app is used to make inferences about your interests, which inform future selection of advertising and/or content.", "The collection of information, and combination with previously collected information, to select and deliver advertisements for you, and to measure the delivery and effectiveness of such advertisements. This includes using previously collected information about your interests to select ads, processing data about what advertisements were shown, how often they were shown, when and where they were shown, and whether you took any action related to the advertisement, including for example clicking an ad or making a purchase. This does not include personalisation, which is the collection and processing of information about your use of this service to subsequently personalise advertising and/or content for you in other contexts, such as websites or apps, over time.", "The collection of information, and combination with previously collected information, to select and deliver content for you, and to measure the delivery and effectiveness of such content. This includes using previously collected information about your interests to select content, processing data about what content was shown, how often or how long it was shown, when and where it was shown, and whether the you took any action related to the content, including for example clicking on content. This does not include personalisation, which is the collection and processing of information about your use of this service to subsequently personalise content and/or advertising for you in other contexts, such as websites or apps, over time.", "The collection of information about your use of the content, and combination with previously collected information, used to measure, understand, and report on your usage of the service. This does not include personalisation, the collection of information about your use of this service to subsequently personalise content and/or advertising for you in other contexts, i.e. on other service, such as websites or apps, over time."];

function fetch_data() {
    api.tabs.query({active: true, currentWindow: true}, function(tabs) {
	if (tabs[0] === undefined) {
	    return;
	}
	try {
	    if (!cmplocator_found) {
		message = {test: "looking for __cmpLocator"};
	    } else {
		message = {call: "getConsentData", manual: false};
	    }
	    var mes = api.tabs.sendMessage(tabs[0].id, message, handle_response);
	} catch(error) {
	    console.log("popup.js: error caught", error);
	}
    });
}

function format_date(date) {
    return date.toLocaleString(undefined, {
	day: 'numeric',
	month: 'numeric',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
    });
}

function find_vendor(id) {
    for (vendor in vendorlist["vendors"]) {
	if (vendorlist["vendors"][vendor]["id"] == id) {
	    return vendorlist["vendors"][vendor]["name"];
	}
    }
    return "[Incorrect vendor, ID " + vendor + "]";
}

function update_with_consent_string_data(consent_string) {
    nb_purposes = consent_string.allowedPurposeIds.length;
    nb_vendors = consent_string.allowedVendorIds.length;
    allowed_purposes = consent_string.allowedPurposeIds;
    if (document.title == "Cookie Glasses") { // this part is unecessary if popup is not open
	var vendors = "";
	var vendor_names = [];
	if (consent_string.allowedVendorIds.length > 0) {
	    for (id in consent_string.allowedVendorIds) {
		vendor_names.push(find_vendor(consent_string.allowedVendorIds[id]));
	    }
	    vendors = "\r\nVendors:\r\n";
	    for (vendor_name in vendor_names.sort()) {
		vendors += vendor_names[vendor_name] + "\r\n";
	    }
	} else {
	    document.getElementById('show_vendors').classList.add("hidden");
	}
	document.getElementById('cmplocator_found').classList.add('hidden');
	document.getElementById('nothing_found').classList.add('hidden');
	document.getElementById('popup-content').classList.remove('hidden');
	document.getElementById('cmp_content').classList.remove('hidden');
	document.getElementById('cmp').textContent = cmp_names[consent_string.cmpId]
	document.getElementById('cmpid').textContent = ' (ID: ' + consent_string.cmpId + ')';
	document.getElementById('nb_purposes').textContent = nb_purposes;
	document.getElementById('vendors').textContent = vendors;
        //document.getElementById('purposes').firstChild().delete();
        var purposes = document.getElementById('purposes');
        while (purposes.firstChild) {
            purposes.removeChild(purposes.lastChild);
        }
	for (i = 0; i < nb_purposes; i++) {
	    purpose_id = parseInt(consent_string.allowedPurposeIds[i], 10);
	    if (purpose_id >= 1 && purpose_id <= 5) {
                var br = document.createElement("br");
                purposes.appendChild(br);
                var text = document.createTextNode("- ");
                purposes.appendChild(text);
                var abbr = document.createElement("abbr");
                abbr.title = descriptions_long[purpose_id - 1];
                var abbr_text = document.createTextNode(descriptions[purpose_id - 1]);
                abbr.appendChild(abbr_text);
                //document.getElementById('purposes').appendChild("\r\n- ");
                purposes.appendChild(abbr); // += "\r\n- <abbr title=\"" +  + "\">" + descriptions[purpose_id - 1] + "</abbr>";
	    }
	}
	//document.getElementById('purposes').textContent = purposes;
	document.getElementById('nb_vendors').textContent = nb_vendors;
	document.getElementById('created').textContent = format_date(consent_string.created);
	document.getElementById('last_updated').textContent = format_date(consent_string.lastUpdated);
    }
}

function handle_response(message) {
    if (message == undefined || message.response == null)
	return;
    if (message.response == "found") {
	cmplocator_found = true;
	fetch_data();
	try {
	    document.getElementById('nothing_found').classList.add('hidden');
	    document.getElementById('cmplocator_found').classList.remove('hidden');
	} catch {
	    // popup not open
	}
	return;
    }
    var res = message.response;
    console.log(res);
    if (res.consentData) {
	consent_string = decodeConsentString(res.consentData);
    }
    update_with_consent_string_data(consent_string);
    if (res.consentData) {
	document.getElementById('show_cs').classList.remove('hidden');
	document.getElementById('manual_cs').classList.add('hidden');
	document.getElementById('consent_string').textContent = res.consentData;
    }
    api.tabs.query({active: true, currentWindow: true}, function(tabs) {
	if (api.browserAction.setIcon) { // setIcon() won't work on mobile
	    tab_id = tabs[0].id;
	    if (nb_vendors + nb_purposes == 0) {
		api.browserAction.setIcon({
		    tabId: tab_id,
		    path: {
			19: "../button/19_green.png",
			38: "../button/38_green.png"
		    }
		});
	    } else {
		api.browserAction.setIcon({
		    tabId: tab_id,
		    path: {
			19: "../button/19_red.png",
			38: "../button/38_red.png"
		    }
		});
	    }
	    api.browserAction.setBadgeText({
		tabId: tab_id,
		text: nb_purposes.toString()
	    });
	}
    });
}

if (document.getElementById('show_vendors')) {
    document.getElementById('show_vendors').onclick = function() {
	document.getElementById('show_vendors').classList.add("hidden");
	document.getElementById('vendors').classList.remove("hidden");
    };
}

if (document.getElementById('decode_cs')) {
    document.getElementById('decode_cs').onclick = function() {
	var raw_consent_string = document.getElementById('cs_to_decode').value;
	try {
	    consent_string = decodeConsentString(raw_consent_string);
	    update_with_consent_string_data(consent_string);
	    document.getElementById('show_cs').classList.add('hidden');
	    document.getElementById('manual_cs').classList.remove('hidden');
	    document.getElementById('decode_cs_error').classList.add('hidden');
	} catch {
	    document.getElementById('decode_cs_error').classList.remove('hidden');
	}
    };
}

window.onload = function() {
    fetch_data();
}

if (document.getElementById('open_decoder')) {
    document.getElementById('open_decoder').onclick = function(e) {
        e.preventDefault();
	document.getElementById('decoder').classList.remove('hidden');
	document.getElementById('open_decoder').classList.add('hidden');
    };
}

window.setInterval(function(){
    fetch_data();
}, 5000);

// https://bugzilla.mozilla.org/show_bug.cgi?id=1425829#c12
async function firefoxWorkaroundForBlankPanel () {
    if (chrome != undefined || browser === undefined) {
	return;
    }
    const {id, width, height} = await browser.windows.getCurrent();
    browser.windows.update(id, {
        width: width + 1,
        height: height + 1
    });
};
firefoxWorkaroundForBlankPanel();

