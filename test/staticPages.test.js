const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function readRoot(file) {
  return fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
}

test('index.html keeps three entries and links cleaning cards to unified page', () => {
  const html = readRoot('index.html');
  assert.match(html, /排班表系统\.html/);
  assert.match(html, /cleaning\.html\?company=yichang/);
  assert.match(html, /cleaning\.html\?company=wuhan/);
});

test('cleaning.html is API backed and selected by company query', () => {
  const html = readRoot('cleaning.html');
  assert.match(html, /new URLSearchParams\(location\.search\)/);
  assert.match(html, /\/api\/companies/);
  assert.match(html, /async function loadCompany/);
  assert.doesNotMatch(html, /const ALL_EMPLOYEES = \[/);
  assert.doesNotMatch(html, /const DEFAULT_AREAS = \{/);
});
