const assert = require('assert');
const { normalizeGstin, validateGstinFormat } = require('../utils/helpers');

// Known valid format examples (checksum-valid test vectors)
const validGstins = [
    '27AAPFU0939F1ZV'
];

const invalidGstins = [
    '',
    '123',
    '27AAPFU0939F1Z', // too short
    '27AAPFU0939F1ZVX', // too long
    '27AAPFU0939F1Z0' // bad checksum
];

console.log('Testing normalizeGstin...');
assert.strictEqual(normalizeGstin(' 27aapfu0939f1zv '), '27AAPFU0939F1ZV');
assert.strictEqual(normalizeGstin('27 AAPFU 0939F 1ZV'), '27AAPFU0939F1ZV');

console.log('Testing validateGstinFormat...');
validGstins.forEach((gstin) => {
    assert.strictEqual(validateGstinFormat(gstin), true, `expected valid: ${gstin}`);
});

invalidGstins.forEach((gstin) => {
    assert.strictEqual(validateGstinFormat(gstin), false, `expected invalid: ${gstin}`);
});

console.log('All GST helper tests passed.');
