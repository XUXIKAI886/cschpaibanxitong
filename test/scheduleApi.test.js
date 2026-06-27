const assert = require('node:assert/strict');
const test = require('node:test');
const { handleApiRequest } = require('../lib/apiHandler');
const { getSeedScheduleSystem } = require('../lib/seedData');

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = value; }
  };
}

function createScheduleRepo() {
  const system = getSeedScheduleSystem();
  let latest = null;
  return {
    async getScheduleSystem(key) {
      return key === system.key ? system : null;
    },
    async addEmployee(_key, name) {
      system.employees.push(name);
      return system;
    },
    async deleteEmployee(_key, name) {
      system.employees = system.employees.filter((employee) => employee !== name);
      return system;
    },
    async saveRecord(systemKey, rows) {
      latest = { systemKey, rows, version: 1 };
      return latest;
    },
    async getLatestRecord() {
      return latest;
    }
  };
}

test('schedule APIs read config and save latest record', async () => {
  const dependencies = { scheduleRepository: createScheduleRepo() };

  const configRes = response();
  await handleApiRequest({ method: 'GET', url: '/api/schedule-systems/operations' }, configRes, dependencies);
  assert.equal(configRes.statusCode, 200);
  assert.ok(JSON.parse(configRes.body).employees.includes('杨有淇'));

  const saveRes = response();
  await handleApiRequest({
    method: 'POST',
    url: '/api/schedule-systems/operations/records',
    body: { rows: [{ name: '杨有淇', schedule: ['', '', '', '', '', 'work', 'rest'] }] }
  }, saveRes, dependencies);
  assert.equal(saveRes.statusCode, 200);
  assert.equal(JSON.parse(saveRes.body).rows[0].name, '杨有淇');

  const latestRes = response();
  await handleApiRequest({ method: 'GET', url: '/api/schedule-systems/operations/records/latest' }, latestRes, dependencies);
  assert.equal(latestRes.statusCode, 200);
  assert.equal(JSON.parse(latestRes.body).rows[0].schedule[5], 'work');
});
