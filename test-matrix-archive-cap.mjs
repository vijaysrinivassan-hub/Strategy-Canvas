import fs from 'node:fs';
import assert from 'node:assert/strict';

// Every matrix revision pushed a full copy of the old matrix into these archives, in every
// product and keyword-node copy, and one board grew past 30 MB until saves timed out.
const source = fs.readFileSync(new URL('./ai-data-icp-matrix.js', import.meta.url), 'utf8');
assert.ok(source.includes('const MATRIX_ARCHIVE_LIMIT=2;'), 'archive limit is defined');
assert.ok(source.includes('icp.icpMatrixArchive=icp.icpMatrixArchive.slice(-MATRIX_ARCHIVE_LIMIT);'), 'ICP archive is capped after each push');
assert.ok(source.includes('value.valueMatrixArchive=value.valueMatrixArchive.slice(-MATRIX_ARCHIVE_LIMIT);'), 'Value archive is capped after each push');
const pushes = (source.match(/MatrixArchive\.push\(/g) || []).length;
const caps = (source.match(/MatrixArchive\.slice\(-MATRIX_ARCHIVE_LIMIT\)/g) || []).length;
assert.equal(caps, pushes, 'every archive push is followed by a cap');
console.log('PASS: matrix archives keep only the latest', 2, 'copies');
