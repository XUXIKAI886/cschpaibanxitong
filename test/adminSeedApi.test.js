const assert = require('node:assert/strict');
const test = require('node:test');
const { handleApiRequest } = require('../lib/apiHandler');

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = value; }
  };
}

test('POST /api/admin/seed seeds cleaning and schedule data', async () => {
  const seeded = { companies: [], scheduleSystems: [] };
  const dependencies = {
    seedRepositories: {
      async seedAll({ companies, scheduleSystem }) {
        seeded.companies = companies.map((company) => company.key);
        seeded.scheduleSystems = [scheduleSystem.key];
      }
    }
  };

  const res = response();
  await handleApiRequest({ method: 'POST', url: '/api/admin/seed' }, res, dependencies);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { ok: true, companies: ['wuhan', 'yichang'], scheduleSystems: ['operations'] });
  assert.deepEqual(seeded.companies, ['wuhan', 'yichang']);
  assert.deepEqual(seeded.scheduleSystems, ['operations']);
});
