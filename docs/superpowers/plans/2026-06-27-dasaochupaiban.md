# Vercel Cloud Scheduling System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the three-entry scheduling homepage to Vercel, add Vercel API Functions connected to MongoDB database `dasaochupaiban`, migrate cleaning and operations schedule data into MongoDB, and update the frontend pages to load/save through APIs.

**Architecture:** Vercel serves the existing static HTML pages and routes `/api/*` to a single Node.js Function in `api/index.js`. Shared database and business logic lives in `lib/`, using MongoDB collections `companies`, `scheduleSystems`, and `scheduleRecords`. `cleaning.html` becomes the unified cleaning page selected by query parameter, while `排班表系统.html` stays as the operations schedule entry and loads config/saved records from APIs.

**Tech Stack:** Vercel Functions, Node.js 20+, MongoDB Node driver, dotenv for local scripts, node:test, native browser JavaScript, existing CDN SheetJS/html2canvas assets.

## Global Constraints

- Deploy on Vercel, not GitHub Pages.
- Use MongoDB database name `dasaochupaiban`.
- Store cleaning company documents in collection `companies`.
- Store operations schedule config in collection `scheduleSystems`.
- Store saved operations schedules in collection `scheduleRecords`.
- Company keys are exactly `wuhan` and `yichang`.
- Operations schedule key is exactly `operations`.
- Keep homepage with three entries.
- Operations entry remains `排班表系统.html`.
- Cleaning entries route to `cleaning.html?company=yichang` and `cleaning.html?company=wuhan`.
- Do not commit the real MongoDB connection string.
- Do not commit `.env`, `.env.local`, or Vercel local environment files.
- Configure `MONGODB_URI` in Vercel environment variables.
- No authentication or password protection is required in this version.
- Keep `武汉公司大扫除安排表.html` and `销售部大扫除安排表.html` as fallback pages until the unified cleaning page is verified.

---

## File Structure

- Create `package.json`: root project scripts and dependencies for Vercel.
- Create `vercel.json`: rewrites `/api/*` to `api/index.js`.
- Create `.env.example`: safe template for local and Vercel environment variables.
- Modify `.gitignore`: ignore env files and dependencies.
- Create `api/index.js`: single Vercel Function entrypoint.
- Create `lib/db.js`: cached MongoDB connection.
- Create `lib/apiHandler.js`: method/path router for all API endpoints.
- Create `lib/http.js`: request parsing, response helpers, and HTTP errors.
- Create `lib/seedData.js`: cleaning and operations schedule seed documents.
- Create `lib/repositories/companyRepository.js`: cleaning company read/edit rules.
- Create `lib/repositories/scheduleRepository.js`: operations schedule config and record rules.
- Create `scripts/seed.js`: CLI seed command.
- Create tests under `test/`.
- Create `cleaning.html`: unified API-backed cleaning page.
- Modify `排班表系统.html`: API-backed operations schedule page.
- Modify `index.html`: keep three entries and route cleaning cards to the unified page.

---

### Task 1: Root Vercel Project Skeleton

**Files:**
- Create: `package.json`
- Create: `vercel.json`
- Create: `.env.example`
- Modify: `.gitignore`
- Create: `api/index.js`
- Create: `lib/http.js`
- Create: `lib/apiHandler.js`
- Test: `test/apiHandler.test.js`

**Interfaces:**
- Produces: `handleApiRequest(req, res, dependencies): Promise<void>`
- Produces: `sendJson(res, statusCode, body): void`
- Produces: `createHttpError(statusCode, code, message): Error`
- Consumes: no prior task output.

- [ ] **Step 1: Create project metadata**

Create `package.json`:

```json
{
  "name": "tuozhuai-paibanbiao",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "vercel dev",
    "seed": "node scripts/seed.js",
    "test": "node --test",
    "start": "vercel dev"
  },
  "dependencies": {
    "@vercel/node": "^3.2.18",
    "dotenv": "^16.4.5",
    "mongodb": "^6.8.0"
  },
  "devDependencies": {
    "vercel": "^35.2.3"
  }
}
```

Create `vercel.json`:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" }
  ]
}
```

Create `.env.example`:

```text
MONGODB_URI=<mongodb connection string>
```

Append to `.gitignore` if not already present:

```gitignore
node_modules/
.env
.env.local
.vercel/
```

- [ ] **Step 2: Write failing health route test**

Create `test/apiHandler.test.js`:

```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
npm install
npm test -- --test-name-pattern "GET /api/health"
```

Expected: FAIL because `lib/apiHandler.js` does not exist.

- [ ] **Step 4: Implement HTTP helpers and API handler**

Create `lib/http.js`:

```js
function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function createHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function parseApiPath(url) {
  const parsed = new URL(url, 'http://localhost');
  return parsed.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

module.exports = {
  sendJson,
  createHttpError,
  parseApiPath,
  readJsonBody
};
```

Create `lib/apiHandler.js`:

```js
const { sendJson, parseApiPath } = require('./http');

async function handleApiRequest(req, res, dependencies = {}) {
  try {
    const parts = parseApiPath(req.url);

    if (req.method === 'GET' && parts.length === 1 && parts[0] === 'health') {
      sendJson(res, 200, { status: 'ok', database: 'dasaochupaiban' });
      return;
    }

    sendJson(res, 404, { error: 'not_found', message: 'API route not found' });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.code || 'internal_error',
      message: error.message || 'Internal server error'
    });
  }
}

module.exports = { handleApiRequest };
```

Create `api/index.js`:

```js
const { handleApiRequest } = require('../lib/apiHandler');
const { getDatabase } = require('../lib/db');
const { createCompanyRepository } = require('../lib/repositories/companyRepository');
const { createScheduleRepository } = require('../lib/repositories/scheduleRepository');

module.exports = async function api(req, res) {
  const db = await getDatabase();
  await handleApiRequest(req, res, {
    companyRepository: createCompanyRepository(db.collection('companies')),
    scheduleRepository: createScheduleRepository(
      db.collection('scheduleSystems'),
      db.collection('scheduleRecords')
    )
  });
};
```

`api/index.js` will not pass until later repository tasks create the imported modules. That is acceptable because this task's test imports only `lib/apiHandler.js`.

- [ ] **Step 5: Run health test to verify it passes**

Run:

```bash
npm test -- --test-name-pattern "GET /api/health"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vercel.json .env.example .gitignore api/index.js lib/http.js lib/apiHandler.js test/apiHandler.test.js
git commit -m "feat: add vercel api skeleton"
```

---

### Task 2: MongoDB Connection and Seed Data

**Files:**
- Create: `lib/db.js`
- Create: `lib/seedData.js`
- Create: `scripts/seed.js`
- Test: `test/seedData.test.js`

**Interfaces:**
- Produces: `getDatabase(): Promise<Db>`
- Produces: `closeDatabase(): Promise<void>`
- Produces: `getSeedCompanies(): CompanyDocument[]`
- Produces: `getSeedScheduleSystem(): ScheduleSystemDocument`
- Consumes: data from current HTML files.

- [ ] **Step 1: Write failing seed tests**

Create `test/seedData.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern "seed data contains"
```

Expected: FAIL because `lib/seedData.js` does not exist.

- [ ] **Step 3: Implement database helper**

Create `lib/db.js`:

```js
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function getDatabase() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) {
    throw new Error('MONGODB_URI is required');
  }

  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db('dasaochupaiban');
  return cachedDb;
}

async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close();
  }
  cachedClient = null;
  cachedDb = null;
}

module.exports = { getDatabase, closeDatabase };
```

- [ ] **Step 4: Implement seed data**

Create `lib/seedData.js` with the current Wuhan, Yichang, and operations schedule data:

```js
const seedCompanies = [
  {
    key: 'wuhan',
    name: '武汉公司',
    subtitle: '武汉清洁任务分配系统',
    storageKey: 'whClean2',
    employees: [
      '王娟', '王盼', '李梓萱', '向文强',
      '武力力', '柯松', '韩大武', '张兴岚',
      '李晨雨', '阳莲心', '屈维涛', '肖锐',
      '盛亚娥', '罗鹰', '张新业'
    ],
    areas: [
      { name: '办公区', tasks: [{ name: '地面吸尘' }, { name: '擦桌椅及摆放' }, { name: '擦饮水机' }, { name: '擦冰箱及清理' }] },
      { name: '财务办公室', tasks: [{ name: '洗茶具' }, { name: '擦桌椅、沙发及物品归位' }, { name: '地面吸尘' }] },
      { name: '会议室', tasks: [{ name: '地面吸尘' }, { name: '擦桌椅及摆放' }] },
      { name: '人事办公室', tasks: [{ name: '人事办公室清洁（固定：盛亚娥）' }] },
      { name: '其它', tasks: [{ name: '绿植浇水（换水）' }] },
      { name: '休息区', tasks: [{ name: '擦荣誉墙' }, { name: '擦桌椅及摆放' }, { name: '地面吸尘' }] }
    ],
    fixedAssignments: [
      { areaName: '人事办公室', taskName: '人事办公室清洁（固定：盛亚娥）', employeeName: '盛亚娥' }
    ]
  },
  {
    key: 'yichang',
    name: '宜昌公司',
    subtitle: '宜昌清洁任务分配系统',
    storageKey: 'ycClean2',
    employees: [
      '胡双双', '王涛', '梁智', '朱文雯',
      '王清月', '陶思雨', '杨有淇', '冯杉杉',
      '吴思湘', '陈吉姝', '袁丽妮',
      '陈冉', '徐晓辉', '秦金城',
      '赵春艳', '周广鑫', '周红莲'
    ],
    areas: [
      { name: '大厅', tasks: [{ name: '扫地' }, { name: '拖地（第1人）' }, { name: '拖地（第2人）' }, { name: '擦桌椅墙饰饮水机（第1人）' }, { name: '擦桌椅墙饰饮水机（第2人）' }] },
      { name: '总经理室', tasks: [{ name: '洗茶具，擦桌椅' }, { name: '擦所有玻璃' }, { name: '扫地拖地' }] },
      { name: '会议室，仓库，贵宾室', tasks: [{ name: '扫地及凳子摆放整齐' }, { name: '擦桌椅门窗及微波炉' }, { name: '拖地' }] },
      { name: '前台', tasks: [{ name: '前台清洁（固定：吴思湘）' }] },
      { name: '其他', tasks: [{ name: '绿植浇水，换垃圾袋' }] },
      { name: '大厅角落', tasks: [{ name: '大厅角落清洁（固定：徐晓辉）' }] }
    ],
    fixedAssignments: [
      { areaName: '前台', taskName: '前台清洁（固定：吴思湘）', employeeName: '吴思湘' },
      { areaName: '大厅角落', taskName: '大厅角落清洁（固定：徐晓辉）', employeeName: '徐晓辉' }
    ]
  }
];

const seedScheduleSystem = {
  key: 'operations',
  name: '排班表系统',
  storageKey: 'schedule_v2',
  employees: ['杨有淇', '陈吉舒', '王涛', '王清月', '袁丽妮', '陈冉'],
  dayNames: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期天'],
  defaultSelectedDayIndexes: [5, 6],
  rules: {
    sundayWorkCount: 2,
    twoDayComplement: true
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSeedCompanies() {
  return clone(seedCompanies);
}

function getSeedScheduleSystem() {
  return clone(seedScheduleSystem);
}

module.exports = {
  getSeedCompanies,
  getSeedScheduleSystem
};
```

- [ ] **Step 5: Add seed script**

Create `scripts/seed.js`:

```js
require('dotenv').config();

const { getDatabase, closeDatabase } = require('../lib/db');
const { getSeedCompanies, getSeedScheduleSystem } = require('../lib/seedData');

async function main() {
  const db = await getDatabase();
  const now = new Date().toISOString();

  for (const company of getSeedCompanies()) {
    await db.collection('companies').replaceOne(
      { key: company.key },
      { ...company, updatedAt: now },
      { upsert: true }
    );
  }

  const scheduleSystem = getSeedScheduleSystem();
  await db.collection('scheduleSystems').replaceOne(
    { key: scheduleSystem.key },
    { ...scheduleSystem, updatedAt: now },
    { upsert: true }
  );

  console.log('Seeded companies: wuhan, yichang');
  console.log('Seeded schedule system: operations');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
```

- [ ] **Step 6: Run seed tests**

Run:

```bash
npm test -- --test-name-pattern "seed data contains"
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/db.js lib/seedData.js scripts/seed.js test/seedData.test.js
git commit -m "feat: add mongo seed data"
```

---

### Task 3: Cleaning Company Repository and API Routes

**Files:**
- Create: `lib/repositories/companyRepository.js`
- Modify: `lib/apiHandler.js`
- Test: `test/companyApi.test.js`

**Interfaces:**
- Consumes: `companyRepository` dependency in `handleApiRequest`.
- Produces cleaning APIs:
  - `GET /api/companies`
  - `GET /api/companies/:key`
  - employee, area, and task mutation routes.

- [ ] **Step 1: Write failing company API tests**

Create `test/companyApi.test.js` with fake repositories:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern "company APIs"
```

Expected: FAIL because company routes are not handled.

- [ ] **Step 3: Implement company repository**

Create `lib/repositories/companyRepository.js` with methods:

```js
const { createHttpError } = require('../http');

function normalizeName(name, fieldName) {
  if (typeof name !== 'string' || !name.trim()) {
    throw createHttpError(400, 'invalid_name', `${fieldName} is required`);
  }
  return name.trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createCompanyRepository(collection) {
  async function save(company) {
    const next = { ...company, updatedAt: new Date().toISOString() };
    await collection.replaceOne({ key: next.key }, next, { upsert: true });
    return clone(next);
  }

  async function requireCompany(key) {
    const company = await collection.findOne({ key });
    if (!company) throw createHttpError(404, 'company_not_found', `Company ${key} was not found`);
    return company;
  }

  async function listCompanies() {
    const docs = await collection.find({}).project({ _id: 0, key: 1, name: 1, subtitle: 1, storageKey: 1 }).sort({ key: 1 }).toArray();
    return docs.map((doc) => ({ key: doc.key, name: doc.name, subtitle: doc.subtitle, storageKey: doc.storageKey }));
  }

  async function getCompany(key) {
    const company = await collection.findOne({ key });
    return company ? clone(company) : null;
  }

  async function addEmployee(key, rawName) {
    const name = normalizeName(rawName, 'employee name');
    const company = await requireCompany(key);
    if (company.employees.includes(name)) throw createHttpError(409, 'duplicate_employee', `${name} already exists`);
    company.employees.push(name);
    return save(company);
  }

  async function deleteEmployee(key, rawName) {
    const name = normalizeName(rawName, 'employee name');
    const company = await requireCompany(key);
    if (company.fixedAssignments.some((item) => item.employeeName === name)) {
      throw createHttpError(409, 'fixed_employee', `${name} is a fixed assignment employee`);
    }
    company.employees = company.employees.filter((item) => item !== name);
    return save(company);
  }

  async function addArea(key, rawName, rawFirstTaskName) {
    const name = normalizeName(rawName, 'area name');
    const firstTaskName = normalizeName(rawFirstTaskName, 'first task name');
    const company = await requireCompany(key);
    if (company.areas.some((area) => area.name === name)) throw createHttpError(409, 'duplicate_area', `${name} already exists`);
    company.areas.push({ name, tasks: [{ name: firstTaskName }] });
    return save(company);
  }

  async function deleteArea(key, rawName) {
    const name = normalizeName(rawName, 'area name');
    const company = await requireCompany(key);
    company.areas = company.areas.filter((area) => area.name !== name);
    company.fixedAssignments = company.fixedAssignments.filter((item) => item.areaName !== name);
    return save(company);
  }

  async function addTask(key, rawAreaName, rawTaskName) {
    const areaName = normalizeName(rawAreaName, 'area name');
    const taskName = normalizeName(rawTaskName, 'task name');
    const company = await requireCompany(key);
    const area = company.areas.find((item) => item.name === areaName);
    if (!area) throw createHttpError(404, 'area_not_found', `${areaName} was not found`);
    if (area.tasks.some((task) => task.name === taskName)) throw createHttpError(409, 'duplicate_task', `${taskName} already exists`);
    area.tasks.push({ name: taskName });
    return save(company);
  }

  async function deleteTask(key, rawAreaName, rawTaskName) {
    const areaName = normalizeName(rawAreaName, 'area name');
    const taskName = normalizeName(rawTaskName, 'task name');
    const company = await requireCompany(key);
    const area = company.areas.find((item) => item.name === areaName);
    if (!area) throw createHttpError(404, 'area_not_found', `${areaName} was not found`);
    if (company.fixedAssignments.some((item) => item.areaName === areaName && item.taskName === taskName)) {
      throw createHttpError(409, 'fixed_task', `${taskName} is a fixed assignment task`);
    }
    area.tasks = area.tasks.filter((task) => task.name !== taskName);
    return save(company);
  }

  return { listCompanies, getCompany, addEmployee, deleteEmployee, addArea, deleteArea, addTask, deleteTask };
}

module.exports = { createCompanyRepository };
```

- [ ] **Step 4: Route company APIs in `lib/apiHandler.js`**

Update `handleApiRequest` to dispatch:

```js
const { sendJson, parseApiPath, readJsonBody } = require('./http');

async function handleApiRequest(req, res, dependencies = {}) {
  try {
    const parts = parseApiPath(req.url);
    const companyRepository = dependencies.companyRepository;

    if (req.method === 'GET' && parts.length === 1 && parts[0] === 'health') {
      sendJson(res, 200, { status: 'ok', database: 'dasaochupaiban' });
      return;
    }

    if (parts[0] === 'companies' && companyRepository) {
      if (req.method === 'GET' && parts.length === 1) {
        sendJson(res, 200, await companyRepository.listCompanies());
        return;
      }
      if (req.method === 'GET' && parts.length === 2) {
        const company = await companyRepository.getCompany(parts[1]);
        if (!company) {
          sendJson(res, 404, { error: 'company_not_found', message: `Company ${parts[1]} was not found` });
          return;
        }
        sendJson(res, 200, company);
        return;
      }
      if (req.method === 'POST' && parts.length === 3 && parts[2] === 'employees') {
        const body = await readJsonBody(req);
        sendJson(res, 200, await companyRepository.addEmployee(parts[1], body.name));
        return;
      }
      if (req.method === 'DELETE' && parts.length === 4 && parts[2] === 'employees') {
        sendJson(res, 200, await companyRepository.deleteEmployee(parts[1], parts[3]));
        return;
      }
      if (req.method === 'POST' && parts.length === 3 && parts[2] === 'areas') {
        const body = await readJsonBody(req);
        sendJson(res, 200, await companyRepository.addArea(parts[1], body.name, body.firstTaskName));
        return;
      }
      if (req.method === 'DELETE' && parts.length === 4 && parts[2] === 'areas') {
        sendJson(res, 200, await companyRepository.deleteArea(parts[1], parts[3]));
        return;
      }
      if (req.method === 'POST' && parts.length === 5 && parts[2] === 'areas' && parts[4] === 'tasks') {
        const body = await readJsonBody(req);
        sendJson(res, 200, await companyRepository.addTask(parts[1], parts[3], body.name));
        return;
      }
      if (req.method === 'DELETE' && parts.length === 6 && parts[2] === 'areas' && parts[4] === 'tasks') {
        sendJson(res, 200, await companyRepository.deleteTask(parts[1], parts[3], parts[5]));
        return;
      }
    }

    sendJson(res, 404, { error: 'not_found', message: 'API route not found' });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.code || 'internal_error',
      message: error.message || 'Internal server error'
    });
  }
}

module.exports = { handleApiRequest };
```

- [ ] **Step 5: Run company API tests**

Run:

```bash
npm test -- --test-name-pattern "company APIs|GET /api/health"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/companyRepository.js lib/apiHandler.js test/companyApi.test.js
git commit -m "feat: add cleaning company apis"
```

---

### Task 4: Operations Schedule Repository and API Routes

**Files:**
- Create: `lib/repositories/scheduleRepository.js`
- Modify: `lib/apiHandler.js`
- Test: `test/scheduleApi.test.js`

**Interfaces:**
- Consumes: `scheduleRepository` dependency in `handleApiRequest`.
- Produces:
  - `GET /api/schedule-systems/:key`
  - `POST /api/schedule-systems/:key/employees`
  - `DELETE /api/schedule-systems/:key/employees/:employeeName`
  - `GET /api/schedule-systems/:key/records/latest`
  - `POST /api/schedule-systems/:key/records`

- [ ] **Step 1: Write failing schedule API tests**

Create `test/scheduleApi.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern "schedule APIs"
```

Expected: FAIL because schedule routes are not handled.

- [ ] **Step 3: Implement schedule repository**

Create `lib/repositories/scheduleRepository.js`:

```js
const { createHttpError } = require('../http');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw createHttpError(400, 'invalid_name', 'employee name is required');
  }
  return name.trim();
}

function createScheduleRepository(systemCollection, recordCollection) {
  async function requireSystem(key) {
    const system = await systemCollection.findOne({ key });
    if (!system) throw createHttpError(404, 'schedule_system_not_found', `Schedule system ${key} was not found`);
    return system;
  }

  async function saveSystem(system) {
    const next = { ...system, updatedAt: new Date().toISOString() };
    await systemCollection.replaceOne({ key: next.key }, next, { upsert: true });
    return clone(next);
  }

  async function getScheduleSystem(key) {
    const system = await systemCollection.findOne({ key });
    return system ? clone(system) : null;
  }

  async function addEmployee(key, rawName) {
    const name = normalizeName(rawName);
    const system = await requireSystem(key);
    if (system.employees.includes(name)) throw createHttpError(409, 'duplicate_employee', `${name} already exists`);
    system.employees.push(name);
    return saveSystem(system);
  }

  async function deleteEmployee(key, rawName) {
    const name = normalizeName(rawName);
    const system = await requireSystem(key);
    system.employees = system.employees.filter((item) => item !== name);
    return saveSystem(system);
  }

  async function saveRecord(key, rows) {
    const system = await requireSystem(key);
    if (!Array.isArray(rows)) throw createHttpError(400, 'invalid_schedule_rows', 'rows must be an array');
    const validNames = new Set(system.employees);
    rows.forEach((row) => {
      if (!validNames.has(row.name)) throw createHttpError(400, 'invalid_schedule_employee', `${row.name} is not a valid employee`);
      if (!Array.isArray(row.schedule) || row.schedule.length !== system.dayNames.length) {
        throw createHttpError(400, 'invalid_schedule_length', `${row.name} schedule length is invalid`);
      }
    });
    const latest = await recordCollection.findOne({ systemKey: key }, { sort: { version: -1 } });
    const record = {
      systemKey: key,
      version: latest ? latest.version + 1 : 1,
      rows: clone(rows),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await recordCollection.insertOne(record);
    return clone(record);
  }

  async function getLatestRecord(key) {
    const record = await recordCollection.findOne({ systemKey: key }, { sort: { version: -1 } });
    return record ? clone(record) : null;
  }

  return { getScheduleSystem, addEmployee, deleteEmployee, saveRecord, getLatestRecord };
}

module.exports = { createScheduleRepository };
```

- [ ] **Step 4: Add schedule routing**

In `lib/apiHandler.js`, dispatch `parts[0] === 'schedule-systems'`:

```js
const scheduleRepository = dependencies.scheduleRepository;

if (parts[0] === 'schedule-systems' && scheduleRepository) {
  if (req.method === 'GET' && parts.length === 2) {
    const system = await scheduleRepository.getScheduleSystem(parts[1]);
    if (!system) {
      sendJson(res, 404, { error: 'schedule_system_not_found', message: `Schedule system ${parts[1]} was not found` });
      return;
    }
    sendJson(res, 200, system);
    return;
  }
  if (req.method === 'POST' && parts.length === 3 && parts[2] === 'employees') {
    const body = await readJsonBody(req);
    sendJson(res, 200, await scheduleRepository.addEmployee(parts[1], body.name));
    return;
  }
  if (req.method === 'DELETE' && parts.length === 4 && parts[2] === 'employees') {
    sendJson(res, 200, await scheduleRepository.deleteEmployee(parts[1], parts[3]));
    return;
  }
  if (req.method === 'GET' && parts.length === 4 && parts[2] === 'records' && parts[3] === 'latest') {
    sendJson(res, 200, await scheduleRepository.getLatestRecord(parts[1]));
    return;
  }
  if (req.method === 'POST' && parts.length === 3 && parts[2] === 'records') {
    const body = await readJsonBody(req);
    sendJson(res, 200, await scheduleRepository.saveRecord(parts[1], body.rows));
    return;
  }
}
```

- [ ] **Step 5: Run schedule API tests**

Run:

```bash
npm test -- --test-name-pattern "schedule APIs"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/repositories/scheduleRepository.js lib/apiHandler.js test/scheduleApi.test.js
git commit -m "feat: add operations schedule apis"
```

---

### Task 5: Admin Seed API

**Files:**
- Modify: `lib/apiHandler.js`
- Test: `test/adminSeedApi.test.js`

**Interfaces:**
- Consumes seed data from `lib/seedData.js`.
- Produces: `POST /api/admin/seed`.

- [ ] **Step 1: Write failing admin seed API test**

Create `test/adminSeedApi.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern "POST /api/admin/seed"
```

Expected: FAIL because admin route is not handled.

- [ ] **Step 3: Add seed handler**

In `lib/apiHandler.js`, add:

```js
const { getSeedCompanies, getSeedScheduleSystem } = require('./seedData');
```

Inside `handleApiRequest`, before 404:

```js
if (req.method === 'POST' && parts.length === 2 && parts[0] === 'admin' && parts[1] === 'seed') {
  const companies = getSeedCompanies();
  const scheduleSystem = getSeedScheduleSystem();
  await dependencies.seedRepositories.seedAll({ companies, scheduleSystem });
  sendJson(res, 200, { ok: true, companies: companies.map((company) => company.key), scheduleSystems: [scheduleSystem.key] });
  return;
}
```

Update `api/index.js` to pass `seedRepositories`:

```js
seedRepositories: {
  async seedAll({ companies, scheduleSystem }) {
    const now = new Date().toISOString();
    for (const company of companies) {
      await db.collection('companies').replaceOne({ key: company.key }, { ...company, updatedAt: now }, { upsert: true });
    }
    await db.collection('scheduleSystems').replaceOne({ key: scheduleSystem.key }, { ...scheduleSystem, updatedAt: now }, { upsert: true });
  }
}
```

- [ ] **Step 4: Run admin seed test**

Run:

```bash
npm test -- --test-name-pattern "POST /api/admin/seed"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/apiHandler.js api/index.js test/adminSeedApi.test.js
git commit -m "feat: add admin seed api"
```

---

### Task 6: Unified Cleaning Page and Homepage Routing

**Files:**
- Create: `cleaning.html`
- Modify: `index.html`
- Test: `test/staticPages.test.js`

**Interfaces:**
- Consumes cleaning company APIs from Task 3.
- Produces:
  - `cleaning.html?company=wuhan`
  - `cleaning.html?company=yichang`
  - homepage links to both company-specific URLs.

- [ ] **Step 1: Write failing static page tests**

Create `test/staticPages.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern "index.html keeps|cleaning.html is API"
```

Expected: FAIL because `cleaning.html` does not exist and index links still point to old cleaning pages.

- [ ] **Step 3: Create API-backed `cleaning.html`**

Create `cleaning.html` with:

- company query parsing:

```js
const requestedCompany = new URLSearchParams(location.search).get('company') || 'wuhan';
```

- API loader:

```js
async function loadCompany(key) {
  currentCompany = await apiRequest(`/api/companies/${encodeURIComponent(key)}`);
  loadLocalState();
  renderAll();
}
```

- mutation calls:

```js
await apiRequest(`/api/companies/${currentCompany.key}/employees`, {
  method: 'POST',
  body: JSON.stringify({ name })
});
```

Reuse the existing cleaning page visual language and browser-side assignment/export logic from the old pages. Do not hardcode `ALL_EMPLOYEES` or `DEFAULT_AREAS`.

- [ ] **Step 4: Update homepage links**

Modify the Yichang card button in `index.html`:

```html
<a href="cleaning.html?company=yichang" class="card-button">
```

Modify the Wuhan card button in `index.html`:

```html
<a href="cleaning.html?company=wuhan" class="card-button">
```

Keep the operations schedule card linked to:

```html
<a href="排班表系统.html" class="card-button">
```

- [ ] **Step 5: Run static page tests**

Run:

```bash
npm test -- --test-name-pattern "index.html keeps|cleaning.html is API"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add cleaning.html index.html test/staticPages.test.js
git commit -m "feat: add vercel cleaning page"
```

---

### Task 7: API-Backed Operations Schedule Page

**Files:**
- Modify: `排班表系统.html`
- Modify: `test/staticPages.test.js`

**Interfaces:**
- Consumes operations APIs from Task 4.
- Produces:
  - `loadScheduleSystem(): Promise<void>`
  - `loadLatestSchedule(): Promise<void>`
  - `saveSchedule(): Promise<void>` that posts to `/api/schedule-systems/operations/records`

- [ ] **Step 1: Add failing static test for schedule page API hooks**

Append to `test/staticPages.test.js`:

```js
test('operations schedule page loads config and saves records through API', () => {
  const html = readRoot('排班表系统.html');
  assert.match(html, /async function loadScheduleSystem/);
  assert.match(html, /async function loadLatestSchedule/);
  assert.match(html, /\/api\/schedule-systems\/operations/);
  assert.match(html, /\/records\/latest/);
  assert.doesNotMatch(html, /const employees = \[/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --test-name-pattern "operations schedule page"
```

Expected: FAIL because `排班表系统.html` still hardcodes `const employees`.

- [ ] **Step 3: Replace hardcoded schedule data with runtime state**

In `排班表系统.html`, replace:

```js
const employees = ['杨有淇', '陈吉舒', '王涛', '王清月', '袁丽妮', '陈冉'];
const dayNames = ['星期一','星期二','星期三','星期四','星期五','星期六','星期天'];
```

with:

```js
let employees = [];
let dayNames = [];
let scheduleRules = { sundayWorkCount: 2, twoDayComplement: true };
```

- [ ] **Step 4: Add API request helpers**

Add before `initScheduleTable()`:

```js
async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || '请求失败');
  return data;
}

async function loadScheduleSystem() {
  const system = await apiRequest('/api/schedule-systems/operations');
  employees = system.employees || [];
  dayNames = system.dayNames || ['星期一','星期二','星期三','星期四','星期五','星期六','星期天'];
  scheduleRules = system.rules || scheduleRules;
  applyDefaultSelectedDays(system.defaultSelectedDayIndexes || [5, 6]);
}
```

- [ ] **Step 5: Add default day selector sync**

Add:

```js
function applyDefaultSelectedDays(indexes) {
  const selected = new Set(indexes);
  document.querySelectorAll('.day-pill input').forEach((input) => {
    input.checked = selected.has(Number(input.value));
    input.closest('.day-pill').classList.toggle('selected', input.checked);
  });
}
```

- [ ] **Step 6: Update save and latest-load behavior**

Replace `saveSchedule()` with:

```js
async function saveSchedule() {
  const rows = [];
  document.querySelectorAll('#scheduleBody tr').forEach(row => {
    const name = row.querySelector('.emp-name').textContent;
    const schedule = Array.from(row.children).slice(1).map(td => {
      const sc = td.querySelector('.schedule-cell');
      if (sc.classList.contains('work-assigned')) return 'work';
      if (sc.classList.contains('rest-assigned')) return 'rest';
      return '';
    });
    rows.push({ name, schedule });
  });
  await apiRequest('/api/schedule-systems/operations/records', {
    method: 'POST',
    body: JSON.stringify({ rows })
  });
  localStorage.setItem('schedule_v2', JSON.stringify(rows));
  toast('已保存到云数据库 ✓');
}
```

Add:

```js
async function loadLatestSchedule() {
  const record = await apiRequest('/api/schedule-systems/operations/records/latest');
  const rows = record && record.rows ? record.rows : [];
  const byName = new Map(rows.map((row) => [row.name, row.schedule]));
  document.querySelectorAll('#scheduleBody tr').forEach(row => {
    const name = row.querySelector('.emp-name').textContent;
    const schedule = byName.get(name) || [];
    Array.from(row.children).slice(1).forEach((td, index) => {
      const status = schedule[index];
      const cell = td.querySelector('.schedule-cell');
      if (status === 'work' || status === 'rest') setScheduleStatus(cell, status);
    });
  });
}
```

- [ ] **Step 7: Update boot flow**

Replace the existing DOMContentLoaded body with:

```js
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadScheduleSystem();
    initScheduleTable();
    initDragAndDrop();
    initDaySelector();
    initContextMenu();
    updateGenBtn();
    await loadLatestSchedule();
  } catch (error) {
    toast(error.message || '排班数据加载失败');
  }
});
```

- [ ] **Step 8: Use API-provided Sunday rule**

In `generateRegular()`, replace:

```js
if (d.name === '星期天') workCount = 2;
```

with:

```js
if (d.name === '星期天') workCount = scheduleRules.sundayWorkCount || 2;
```

- [ ] **Step 9: Run static test**

Run:

```bash
npm test -- --test-name-pattern "operations schedule page"
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add "排班表系统.html" test/staticPages.test.js
git commit -m "feat: load operations schedule from api"
```

---

### Task 8: Local Vercel and MongoDB Verification

**Files:**
- Local only: `.env`

**Interfaces:**
- Consumes all previous tasks.
- Produces verified local Vercel app and seeded MongoDB data.

- [ ] **Step 1: Create local env**

Create `.env` from the local `数据库` file:

```text
MONGODB_URI=<real MongoDB connection string from local 数据库 file>
```

Do not commit `.env`.

- [ ] **Step 2: Run full tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Seed MongoDB**

Run:

```bash
npm run seed
```

Expected output:

```text
Seeded companies: wuhan, yichang
Seeded schedule system: operations
```

- [ ] **Step 4: Start Vercel dev**

Run:

```bash
npm run dev
```

Expected: Vercel dev server starts and serves a local URL, usually `http://localhost:3000`.

- [ ] **Step 5: Verify APIs**

Run in a second terminal:

```bash
Invoke-RestMethod -Uri 'http://localhost:3000/api/health'
Invoke-RestMethod -Uri 'http://localhost:3000/api/companies'
Invoke-RestMethod -Uri 'http://localhost:3000/api/companies/wuhan'
Invoke-RestMethod -Uri 'http://localhost:3000/api/schedule-systems/operations'
Invoke-RestMethod -Uri 'http://localhost:3000/api/schedule-systems/operations/records/latest'
```

Expected:

- Health returns `status = ok`.
- Companies include `wuhan` and `yichang`.
- Wuhan employees include `张新业`.
- Operations employees include `杨有淇` and `陈冉`.

- [ ] **Step 6: Verify homepage and pages**

Open:

```text
http://localhost:3000/index.html
```

Manual checks:

- The homepage still has three entries.
- Operations entry opens `排班表系统.html`.
- Yichang entry opens `cleaning.html?company=yichang`.
- Wuhan entry opens `cleaning.html?company=wuhan`.
- Operations page loads employees from API, generates schedule, saves to cloud, refreshes and restores latest saved record.
- Wuhan cleaning page loads `张新业`.
- Yichang cleaning page loads `吴思湘` and `徐晓辉` fixed assignments.
- Temporary add/delete employee works in cleaning and operations pages.
- Temporary add/delete cleaning area and task works.
- Excel export still works.

- [ ] **Step 7: Stop Vercel dev**

Stop with `Ctrl+C`.

- [ ] **Step 8: Commit verification fixes only**

If verification required fixes:

```bash
git add <fixed-files>
git commit -m "fix: verify vercel scheduling workflow"
```

If no fixes were required, do not create an empty commit.

---

### Task 9: Vercel Deployment Checklist

**Files:**
- No source changes expected unless adding deployment notes.

**Interfaces:**
- Produces deploy-ready repository.

- [ ] **Step 1: Confirm no secrets**

Run:

```bash
rg -n "mongo(db://|db\\+srv://)|root:|MONGODB[_]URI=.*\\x40" --glob "!.env" --glob "!.env.local" --glob "!数据库" --glob "!docs/superpowers/**"
```

Expected:

- No real MongoDB URI appears in tracked source files.
- `.env.example` contains only placeholder values.

- [ ] **Step 2: Confirm Vercel env var**

In Vercel Project Settings, add:

```text
MONGODB_URI=<real MongoDB connection string>
```

Apply it to Production, Preview, and Development unless there is a reason to separate them.

- [ ] **Step 3: Run final automated tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Review final diff**

Run:

```bash
git status --short --branch
git diff origin/master...HEAD --stat
```

Expected:

- Planned source files only.
- Existing unrelated untracked files are not included.

- [ ] **Step 5: Push when requested**

Only after user asks to publish:

```bash
git push origin master
```

Expected: remote `master` updates successfully.

Vercel should deploy from the connected Git repository after push, or deploy manually through the Vercel CLI if the project is not connected.

---

## Self-Review

- Spec coverage: The plan covers Vercel deployment, MongoDB connection, seed data for cleaning and operations schedule, APIs for both systems, unified cleaning page, operations schedule API integration, homepage routing, tests, and Vercel deployment checks.
- Placeholder scan: No placeholder markers or unspecified implementation steps remain.
- Type consistency: API paths match the spec; repository method names match handler usage; seed keys match frontend query and API keys.
