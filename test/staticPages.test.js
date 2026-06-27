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
  assert.doesNotMatch(html, /saved && isValidAreas\(saved\.areas\)/);
});

test('cleaning.html keeps the original cleaning page UI structure', () => {
  const html = readRoot('cleaning.html');
  assert.match(html, /class="hero"/);
  assert.match(html, /class="stats-bar"/);
  assert.match(html, /class="panels-row"/);
  assert.match(html, /class="table-container"/);
  assert.match(html, /class="cleaning-table"/);
  assert.match(html, /id="ctx-menu"/);
  assert.match(html, /id="task-ctx-menu"/);
  assert.match(html, /onclick="addEmployee\(\)"/);
  assert.match(html, /id="ctx-delete"/);
  assert.match(html, /async function addEmployee/);
  assert.match(html, /async function deleteEmployee/);
  assert.doesNotMatch(html, /class="task-card"/);
  assert.doesNotMatch(html, /id="company-tabs"/);
  assert.doesNotMatch(html, /id="employee-form"/);
});

test('cleaning.html handles async right-click deletes before closing menu', () => {
  const html = readRoot('cleaning.html');
  assert.match(html, /deleteEmployee\(ctxEmployee\)\.catch/);
  assert.match(html, /deleteCustomArea\(ctxArea\)\.catch/);
  assert.match(html, /deleteCustomTask\(taskCtxTask\)\.catch/);
  assert.match(html, /async function reloadCurrentCompany/);
  assert.match(html, /await reloadCurrentCompany\(\)/);
});

test('cleaning.html rebuilds employee pools after remote data changes', () => {
  const html = readRoot('cleaning.html');
  const match = html.match(/function rebuildCleaningView\(\) \{([\s\S]*?)\n\}/);
  assert.ok(match, 'rebuildCleaningView should exist');
  assert.match(match[1], /buildStaffGrid\(\)/);
});

test('operations schedule page loads config and saves records through API', () => {
  const html = readRoot('排班表系统.html');
  assert.match(html, /async function loadScheduleSystem/);
  assert.match(html, /async function loadLatestSchedule/);
  assert.match(html, /\/api\/schedule-systems\/operations/);
  assert.match(html, /\/records\/latest/);
  assert.doesNotMatch(html, /const employees = \[/);
});

test('operations schedule page can add and delete employees through API', () => {
  const html = readRoot('排班表系统.html');
  assert.match(html, /async function addScheduleEmployee/);
  assert.match(html, /async function deleteScheduleEmployee/);
  assert.match(html, /\/api\/schedule-systems\/operations\/employees/);
  assert.match(html, /id="employeeManage"/);
  assert.match(html, /addScheduleEmployee\(\)/);
  assert.match(html, /dataset\.action = 'delete-employee'/);
});
