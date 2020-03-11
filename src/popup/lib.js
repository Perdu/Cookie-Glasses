/*
   Copied from IAB's JS API
   https://github.com/InteractiveAdvertisingBureau/Consent-String-SDK-JS
   (MIT licence)
*/

/**
 * Decode consent data from a web-safe base64-encoded string
 *
 * @param {string} consentString
 */
function decodeConsentString(consentString) {
  const {
    version,
    cmpId,
    vendorListVersion,
    purposeIdBitString,
    maxVendorId,
    created,
    lastUpdated,
    isRange,
    defaultConsent,
    vendorIdBitString,
    vendorRangeList,
    cmpVersion,
    consentScreen,
    consentLanguage,
  } = decodeFromBase64(consentString);

  const consentStringData = {
    version,
    cmpId,
    vendorListVersion,
    allowedPurposeIds: decodeBitsToIds(purposeIdBitString),
    maxVendorId,
    created,
    lastUpdated,
    cmpVersion,
    consentScreen,
    consentLanguage,
  };

  if (isRange) {
    /* eslint no-shadow: off */
    const idMap = vendorRangeList.reduce((acc, { isRange, startVendorId, endVendorId }) => {
      const lastVendorId = isRange ? endVendorId : startVendorId;

      for (let i = startVendorId; i <= lastVendorId; i += 1) {
        acc[i] = true;
      }

      return acc;
    }, {});

    consentStringData.allowedVendorIds = [];

    for (let i = 1; i <= maxVendorId; i += 1) {
      if (
        (defaultConsent && !idMap[i]) ||
        (!defaultConsent && idMap[i])
      ) {
        if (consentStringData.allowedVendorIds.indexOf(i) === -1) {
          consentStringData.allowedVendorIds.push(i);
        }
      }
    }
  } else {
    consentStringData.allowedVendorIds = decodeBitsToIds(vendorIdBitString);
  }

  return consentStringData;
}

function repeat(count, string = '0') {
  let padString = '';

  for (let i = 0; i < count; i += 1) {
    padString += string;
  }

  return padString;
}

function padLeft(string, padding) {
  return repeat(Math.max(0, padding)) + string;
}

function padRight(string, padding) {
  return string + repeat(Math.max(0, padding));
}

function encodeIntToBits(number, numBits) {
  let bitString = '';

  if (typeof number === 'number' && !isNaN(number)) {
    bitString = parseInt(number, 10).toString(2);
  }

  // Pad the string if not filling all bits
  if (numBits >= bitString.length) {
    bitString = padLeft(bitString, numBits - bitString.length);
  }

  // Truncate the string if longer than the number of bits
  if (bitString.length > numBits) {
    bitString = bitString.substring(0, numBits);
  }

  return bitString;
}

function encodeBoolToBits(value) {
  return encodeIntToBits(value === true ? 1 : 0, 1);
}

function encodeDateToBits(date, numBits) {
  if (date instanceof Date) {
    return encodeIntToBits(date.getTime() / 100, numBits);
  }
  return encodeIntToBits(date, numBits);
}

function encodeLetterToBits(letter, numBits) {
  return encodeIntToBits(letter.toUpperCase().charCodeAt(0) - 65, numBits);
}

function encodeLanguageToBits(language, numBits = 12) {
  return encodeLetterToBits(language.slice(0, 1), numBits / 2)
    + encodeLetterToBits(language.slice(1), numBits / 2);
}

function decodeBitsToInt(bitString, start, length) {
  return parseInt(bitString.substr(start, length), 2);
}

function decodeBitsToDate(bitString, start, length) {
  return new Date(decodeBitsToInt(bitString, start, length) * 100);
}

function decodeBitsToBool(bitString, start) {
  return parseInt(bitString.substr(start, 1), 2) === 1;
}

function decodeBitsToLetter(bitString) {
  const letterCode = decodeBitsToInt(bitString);
  return String.fromCharCode(letterCode + 65).toLowerCase();
}

function decodeBitsToLanguage(bitString, start, length) {
  const languageBitString = bitString.substr(start, length);

  return decodeBitsToLetter(languageBitString.slice(0, length / 2))
    + decodeBitsToLetter(languageBitString.slice(length / 2));
}

function encodeField({ input, field }) {
  const { name, type, numBits, encoder, validator } = field;

  if (typeof validator === 'function') {
    if (!validator(input)) {
      return '';
    }
  }
  if (typeof encoder === 'function') {
    return encoder(input);
  }

  const bitCount = typeof numBits === 'function' ? numBits(input) : numBits;

  const inputValue = input[name];
  const fieldValue = inputValue === null || inputValue === undefined ? '' : inputValue;

  switch (type) {
    case 'int':
      return encodeIntToBits(fieldValue, bitCount);
    case 'bool':
      return encodeBoolToBits(fieldValue);
    case 'date':
      return encodeDateToBits(fieldValue, bitCount);
    case 'bits':
      return padRight(fieldValue, bitCount - fieldValue.length).substring(0, bitCount);
    case 'list':
      return fieldValue.reduce((acc, listValue) => acc + encodeFields({
        input: listValue,
        fields: field.fields,
      }), '');
    case 'language':
      return encodeLanguageToBits(fieldValue, bitCount);
    default:
      throw new Error(`ConsentString - Unknown field type ${type} for encoding`);
  }
}

function encodeFields({ input, fields }) {
  return fields.reduce((acc, field) => {
    acc += encodeField({ input, field });

    return acc;
  }, '');
}

function decodeField({ input, output, startPosition, field }) {
  const { type, numBits, decoder, validator, listCount } = field;

  if (typeof validator === 'function') {
    if (!validator(output)) {
      // Not decoding this field so make sure we start parsing the next field at
      // the same point
      return { newPosition: startPosition };
    }
  }

  if (typeof decoder === 'function') {
    return decoder(input, output, startPosition);
  }

  const bitCount = typeof numBits === 'function' ? numBits(output) : numBits;

  switch (type) {
    case 'int':
      return { fieldValue: decodeBitsToInt(input, startPosition, bitCount) };
    case 'bool':
      return { fieldValue: decodeBitsToBool(input, startPosition) };
    case 'date':
      return { fieldValue: decodeBitsToDate(input, startPosition, bitCount) };
    case 'bits':
      return { fieldValue: input.substr(startPosition, bitCount) };
    case 'list':
      return decodeList(input, output, startPosition, field, listCount);
    case 'language':
      return { fieldValue: decodeBitsToLanguage(input, startPosition, bitCount) };
    default:
      throw new Error(`ConsentString - Unknown field type ${type} for decoding`);
  }
}

function decodeList(input, output, startPosition, field, listCount) {
  let listEntryCount = 0;

  if (typeof listCount === 'function') {
    listEntryCount = listCount(output);
  } else if (typeof listCount === 'number') {
    listEntryCount = listCount;
  }

  let newPosition = startPosition;
  const fieldValue = [];

  for (let i = 0; i < listEntryCount; i += 1) {
    const decodedFields = decodeFields({
      input,
      fields: field.fields,
      startPosition: newPosition,
    });
    newPosition = decodedFields.newPosition;
    fieldValue.push(decodedFields.decodedObject);
  }

  return { fieldValue, newPosition };
}

function decodeFields({ input, fields, startPosition = 0 }) {
  let position = startPosition;

  const decodedObject = fields.reduce((acc, field) => {
    const { name, numBits } = field;
    const { fieldValue, newPosition } = decodeField({
      input,
      output: acc,
      startPosition: position,
      field,
    });

    if (fieldValue !== undefined) {
      acc[name] = fieldValue;
    }

    if (newPosition !== undefined) {
      position = newPosition;
    } else if (typeof numBits === 'number') {
      position += numBits;
    }

    return acc;
  }, {});

  return {
    decodedObject,
    newPosition: position,
  };
}

/**
 * Encode the data properties to a bit string. Encoding will encode
 * either `selectedVendorIds` or the `vendorRangeList` depending on
 * the value of the `isRange` flag.
 */
function encodeDataToBits(data, definitionMap) {
  const { version } = data;

  if (typeof version !== 'number') {
    throw new Error('ConsentString - No version field to encode');
  } else if (!definitionMap[version]) {
    throw new Error(`ConsentString - No definition for version ${version}`);
  } else {
    const fields = definitionMap[version].fields;
    return encodeFields({ input: data, fields });
  }
}

/**
 * Take all fields required to encode the consent string and produce the URL safe Base64 encoded value
 */
function encodeToBase64(data, definitionMap = vendorVersionMap) {
  const binaryValue = encodeDataToBits(data, definitionMap);

  if (binaryValue) {
    // Pad length to multiple of 8
    const paddedBinaryValue = padRight(binaryValue, 7 - ((binaryValue.length + 7) % 8));

    // Encode to bytes
    let bytes = '';
    for (let i = 0; i < paddedBinaryValue.length; i += 8) {
      bytes += String.fromCharCode(parseInt(paddedBinaryValue.substr(i, 8), 2));
    }

    // Make base64 string URL friendly
    return base64.encode(bytes)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  return null;
}

function decodeConsentStringBitValue(bitString, definitionMap = vendorVersionMap) {
  const version = decodeBitsToInt(bitString, 0, versionNumBits);

  if (typeof version !== 'number') {
    throw new Error('ConsentString - Unknown version number in the string to decode');
  } else if (!vendorVersionMap[version]) {
    throw new Error(`ConsentString - Unsupported version ${version} in the string to decode`);
  }

  const fields = definitionMap[version].fields;
  const { decodedObject } = decodeFields({ input: bitString, fields });

  return decodedObject;
}

/**
 * Decode the (URL safe Base64) value of a consent string into an object.
 */
function decodeFromBase64(consentString, definitionMap) {
  // Add padding
  let unsafe = consentString;
  while (unsafe.length % 4 !== 0) {
    unsafe += '=';
  }

  // Replace safe characters
  unsafe = unsafe
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const bytes = base64.decode(unsafe);

  let inputBits = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const bitString = bytes.charCodeAt(i).toString(2);
    inputBits += padLeft(bitString, 8 - bitString.length);
  }

  return decodeConsentStringBitValue(inputBits, definitionMap);
}

function decodeBitsToIds(bitString) {
  return bitString.split('').reduce((acc, bit, index) => {
    if (bit === '1') {
      if (acc.indexOf(index + 1) === -1) {
        acc.push(index + 1);
      }
    }
    return acc;
  }, []);
}

/**
 * Number of bits for encoding the version integer
 * Expected to be the same across versions
 */
const versionNumBits = 6;

/**
 * Definition of the consent string encoded format
 *
 * From https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/Draft_for_Public_Comment_Transparency%20%26%20Consent%20Framework%20-%20cookie%20and%20vendor%20list%20format%20specification%20v1.0a.pdf
 */
const vendorVersionMap = {
  /**
   * Version 1
   */
  1: {
    version: 1,
    metadataFields: ['version', 'created', 'lastUpdated', 'cmpId',
      'cmpVersion', 'consentScreen', 'vendorListVersion'],
    fields: [
      { name: 'version', type: 'int', numBits: 6 },
      { name: 'created', type: 'date', numBits: 36 },
      { name: 'lastUpdated', type: 'date', numBits: 36 },
      { name: 'cmpId', type: 'int', numBits: 12 },
      { name: 'cmpVersion', type: 'int', numBits: 12 },
      { name: 'consentScreen', type: 'int', numBits: 6 },
      { name: 'consentLanguage', type: 'language', numBits: 12 },
      { name: 'vendorListVersion', type: 'int', numBits: 12 },
      { name: 'purposeIdBitString', type: 'bits', numBits: 24 },
      { name: 'maxVendorId', type: 'int', numBits: 16 },
      { name: 'isRange', type: 'bool', numBits: 1 },
      {
        name: 'vendorIdBitString',
        type: 'bits',
        numBits: decodedObject => decodedObject.maxVendorId,
        validator: decodedObject => !decodedObject.isRange,
      },
      {
        name: 'defaultConsent',
        type: 'bool',
        numBits: 1,
        validator: decodedObject => decodedObject.isRange,
      },
      {
        name: 'numEntries',
        numBits: 12,
        type: 'int',
        validator: decodedObject => decodedObject.isRange,
      },
      {
        name: 'vendorRangeList',
        type: 'list',
        listCount: decodedObject => decodedObject.numEntries,
        validator: decodedObject => decodedObject.isRange,
        fields: [
          {
            name: 'isRange',
            type: 'bool',
            numBits: 1,
          },
          {
            name: 'startVendorId',
            type: 'int',
            numBits: 16,
          },
          {
            name: 'endVendorId',
            type: 'int',
            numBits: 16,
            validator: decodedObject => decodedObject.isRange,
          },
        ],
      },
    ],
  },
};


// Copied from nodejs's base-64

/*! http://mths.be/base64 v0.1.0 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code, and use
	// it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var InvalidCharacterError = function(message) {
		this.message = message;
	};
	InvalidCharacterError.prototype = new Error;
	InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	var error = function(message) {
		// Note: the error messages used throughout this file match those used by
		// the native `atob`/`btoa` implementation in Chromium.
		throw new InvalidCharacterError(message);
	};

	var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	// http://whatwg.org/html/common-microsyntaxes.html#space-character
	var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

	// `decode` is designed to be fully compatible with `atob` as described in the
	// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
	// The optimized base64-decoding algorithm used is based on @atk’s excellent
	// implementation. https://gist.github.com/atk/1020396
	var decode = function(input) {
		input = String(input)
			.replace(REGEX_SPACE_CHARACTERS, '');
		var length = input.length;
		if (length % 4 == 0) {
			input = input.replace(/==?$/, '');
			length = input.length;
		}
		if (
			length % 4 == 1 ||
			// http://whatwg.org/C#alphanumeric-ascii-characters
			/[^+a-zA-Z0-9/]/.test(input)
		) {
			error(
				'Invalid character: the string to be decoded is not correctly encoded.'
			);
		}
		var bitCounter = 0;
		var bitStorage;
		var buffer;
		var output = '';
		var position = -1;
		while (++position < length) {
			buffer = TABLE.indexOf(input.charAt(position));
			bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
			// Unless this is the first of a group of 4 characters…
			if (bitCounter++ % 4) {
				// …convert the first 8 bits to a single ASCII character.
				output += String.fromCharCode(
					0xFF & bitStorage >> (-2 * bitCounter & 6)
				);
			}
		}
		return output;
	};

	// `encode` is designed to be fully compatible with `btoa` as described in the
	// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
	var encode = function(input) {
		input = String(input);
		if (/[^\0-\xFF]/.test(input)) {
			// Note: no need to special-case astral symbols here, as surrogates are
			// matched, and the input is supposed to only contain ASCII anyway.
			error(
				'The string to be encoded contains characters outside of the ' +
				'Latin1 range.'
			);
		}
		var padding = input.length % 3;
		var output = '';
		var position = -1;
		var a;
		var b;
		var c;
		var d;
		var buffer;
		// Make sure any padding is handled outside of the loop.
		var length = input.length - padding;

		while (++position < length) {
			// Read three bytes, i.e. 24 bits.
			a = input.charCodeAt(position) << 16;
			b = input.charCodeAt(++position) << 8;
			c = input.charCodeAt(++position);
			buffer = a + b + c;
			// Turn the 24 bits into four chunks of 6 bits each, and append the
			// matching character for each of them to the output.
			output += (
				TABLE.charAt(buffer >> 18 & 0x3F) +
				TABLE.charAt(buffer >> 12 & 0x3F) +
				TABLE.charAt(buffer >> 6 & 0x3F) +
				TABLE.charAt(buffer & 0x3F)
			);
		}

		if (padding == 2) {
			a = input.charCodeAt(position) << 8;
			b = input.charCodeAt(++position);
			buffer = a + b;
			output += (
				TABLE.charAt(buffer >> 10) +
				TABLE.charAt((buffer >> 4) & 0x3F) +
				TABLE.charAt((buffer << 2) & 0x3F) +
				'='
			);
		} else if (padding == 1) {
			buffer = input.charCodeAt(position);
			output += (
				TABLE.charAt(buffer >> 2) +
				TABLE.charAt((buffer << 4) & 0x3F) +
				'=='
			);
		}

		return output;
	};

	var base64 = {
		'encode': encode,
		'decode': decode,
		'version': '0.1.0'
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return base64;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = base64;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in base64) {
				base64.hasOwnProperty(key) && (freeExports[key] = base64[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.base64 = base64;
	}

}(this));
