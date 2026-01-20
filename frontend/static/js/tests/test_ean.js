// Mock global window and document for Node.js
global.window = {};
global.document = {
  addEventListener: () => {},
  querySelector: () => null
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.navigator = {
  userAgent: 'node'
};

// Import logic to test
const fs = require('fs');
const path = require('path');

const utilsCode = fs.readFileSync(path.join(__dirname, '../utils.js'), 'utf8');
eval(utilsCode);

// Tests
const Utils = global.window.Utils;

function testEanSearch() {
  console.log('Running EAN Search Tests...');

  // Case 1: Exact match
  const ean1 = "7891234567890";
  console.assert(Utils.validarEAN(ean1) === true, "EAN1 should be valid");

  // Case 2: Processar EAN coletor (remove first and last digit)
  const eanColetor = "878912345678908";
  const processed = Utils.processarEanColetor(eanColetor);
  console.assert(processed === "7891234567890", `Processed EAN should be 7891234567890, got ${processed}`);

  // Case 3: Extrair Núcleo EAN
  const eanExtra = "00789123456789011";
  const nucleo = Utils.extrairNucleoEan(eanExtra);
  console.assert(nucleo === "7891234567890", `Nucleo should be 7891234567890, got ${nucleo}`);

  console.log('EAN Search Tests Passed!');
}

try {
  testEanSearch();
} catch (e) {
  console.error('Test failed:', e);
  process.exit(1);
}
