const assert = require('node:assert/strict');
const test = require('node:test');
const { handleApiRequest } = require('../lib/apiHandler');

function createMockResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value) {
      this.body = value;
    }
  };
}

test('GET /api/health returns ok', async () => {
  const req = { method: 'GET', url: '/api/health' };
  const res = createMockResponse();

  await handleApiRequest(req, res, {});

  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { status: 'ok', database: 'dasaochupaiban' });
});
