const assert = require('node:assert/strict');
const test = require('node:test');
const { handleApiRequest } = require('../lib/apiHandler');
const { getSeedCompanies } = require('../lib/seedData');

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = value; }
  };
}

function createCompanyRepo() {
  const companies = getSeedCompanies();
  return {
    async listCompanies() {
      return companies.map(({ key, name, subtitle, storageKey }) => ({ key, name, subtitle, storageKey }));
    },
    async getCompany(key) {
      return companies.find((company) => company.key === key) || null;
    },
    async addEmployee(key, name) {
      const company = companies.find((item) => item.key === key);
      if (company.employees.includes(name)) {
        const error = new Error('duplicate');
        error.statusCode = 409;
        error.code = 'duplicate_employee';
        throw error;
      }
      company.employees.push(name);
      return company;
    }
  };
}

test('company APIs list, read, and add employees', async () => {
  const dependencies = { companyRepository: createCompanyRepo() };

  const listRes = response();
  await handleApiRequest({ method: 'GET', url: '/api/companies' }, listRes, dependencies);
  assert.equal(listRes.statusCode, 200);
  assert.deepEqual(JSON.parse(listRes.body).map((item) => item.key).sort(), ['wuhan', 'yichang']);

  const getRes = response();
  await handleApiRequest({ method: 'GET', url: '/api/companies/wuhan' }, getRes, dependencies);
  assert.equal(getRes.statusCode, 200);
  assert.ok(JSON.parse(getRes.body).employees.includes('张新业'));

  const addReq = {
    method: 'POST',
    url: '/api/companies/wuhan/employees',
    body: { name: '测试员工' }
  };
  const addRes = response();
  await handleApiRequest(addReq, addRes, dependencies);
  assert.equal(addRes.statusCode, 200);
  assert.ok(JSON.parse(addRes.body).employees.includes('测试员工'));
});
