const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'manifesto_payload.json');
const raw = fs.readFileSync(inputPath, 'utf8');
let inputData;
try {
  inputData = JSON.parse(raw);
} catch (err) {
  console.error('Failed to parse JSON payload:', err.message);
  process.exit(1);
}

function parseManifesto(inputData) {
  let validData = null;
  let erroredCtrcs = [];
  let erroredItems = [];

  if (inputData && inputData.valid !== undefined) {
    validData = Array.isArray(inputData.valid) ? inputData.valid : [inputData.valid];
    erroredCtrcs = Array.isArray(inputData.erroredCtrcs) ? inputData.erroredCtrcs : [];
    erroredItems = Array.isArray(inputData.erroredItems) ? inputData.erroredItems : [];
  } else if (Array.isArray(inputData) && inputData.length > 0 && inputData[0] && inputData[0].concatenated_ctrc) {
    const first = inputData[0] || {};
    const expectedList = String(first.concatenated_ctrc || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const rest = inputData.slice(1);
    // only consider as valid those entries with a non-empty ctrc
    validData = rest.filter((it) => it && typeof it === 'object' && it.ctrc && String(it.ctrc).trim() !== '');
    // explicit error objects
    erroredItems = rest.filter((it) => it && it.error === true);
    // also treat objects without ctrc as errored/raw responses
    const othersWithoutCtrc = rest.filter((it) => it && typeof it === 'object' && !it.ctrc && !it.error);
    if (othersWithoutCtrc.length > 0) erroredItems = erroredItems.concat(othersWithoutCtrc);

    const returnedCtrcs = validData.map((it) => String(it.ctrc).toUpperCase());
    erroredCtrcs = expectedList.filter((e) => !returnedCtrcs.includes(String(e).toUpperCase()));

    return {
      source: 'manifesto-array-first-filter',
      expectedCount: expectedList.length,
      expectedList,
      returnedCount: returnedCtrcs.length,
      returnedCtrcs,
      missingCount: erroredCtrcs.length,
      erroredCtrcs,
      erroredItemsCount: erroredItems.length,
      erroredItems: erroredItems.slice(0, 20),
      validDataCount: validData.length
    };
  } else if (Array.isArray(inputData)) {
    validData = inputData;
  } else if (inputData) {
    validData = [inputData];
  } else {
    validData = [];
  }

  // fallback summary for legacy forms
  return {
    source: 'legacy-or-structured',
    validDataCount: Array.isArray(validData) ? validData.length : 0,
    erroredCtrcs,
    erroredItems
  };
}

const result = parseManifesto(inputData);
console.log(JSON.stringify(result, null, 2));
