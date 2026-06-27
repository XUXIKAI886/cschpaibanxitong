const assert = require('node:assert/strict');
const test = require('node:test');
const { getSeedCompanies, getSeedScheduleSystem } = require('../lib/seedData');

test('seed data contains cleaning companies and operations schedule', () => {
  const companies = getSeedCompanies();
  const schedule = getSeedScheduleSystem();

  assert.deepEqual(companies.map((company) => company.key).sort(), ['wuhan', 'yichang']);
  assert.ok(companies.find((company) => company.key === 'wuhan').employees.includes('张新业'));
  assert.ok(companies.find((company) => company.key === 'yichang').fixedAssignments.some((item) => item.employeeName === '吴思湘'));

  assert.equal(schedule.key, 'operations');
  assert.deepEqual(schedule.employees, ['杨有淇', '陈吉舒', '王涛', '王清月', '袁丽妮', '陈冉']);
  assert.deepEqual(schedule.dayNames, ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期天']);
  assert.deepEqual(schedule.defaultSelectedDayIndexes, [5, 6]);
  assert.equal(schedule.rules.sundayWorkCount, 2);
  assert.equal(schedule.rules.twoDayComplement, true);
});
