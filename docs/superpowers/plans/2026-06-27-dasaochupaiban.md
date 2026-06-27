# Dasaochupaiban Cloud API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Express backend connected to MongoDB database `dasaochupaiban`, seed Wuhan/Yichang cleaning configuration, and add one unified frontend page that reads and edits people, areas, and tasks through APIs.

**Architecture:** A standalone Express app under `server/` serves REST APIs and static files from the repository root. MongoDB stores base cleaning configuration in a `companies` collection, one document per company. The unified `cleaning.html` page loads company data from `/api/companies/:key`, while daily assignment/rest state remains in browser `localStorage`.

**Tech Stack:** Node.js 20+, Express 4, MongoDB Node driver, dotenv, node:test, native browser JavaScript, existing CDN SheetJS for Excel export.

## Global Constraints

- Use MongoDB database name `dasaochupaiban`.
- Store company documents in collection `companies`.
- Company keys are exactly `wuhan` and `yichang`.
- Do not commit the real MongoDB connection string.
- Do not commit `server/.env`.
- No authentication or password protection is required in this version.
- Keep `武汉公司大扫除安排表.html` and `销售部大扫除安排表.html` as fallback pages.
- Assignment state and rest state remain in browser `localStorage`.
- Base configuration in MongoDB includes employees, areas, tasks, fixed assignments, `storageKey`, and display labels.
- Avoid changing unrelated scheduling pages.

---

## File Structure

- Create `server/package.json`: backend scripts and dependencies.
- Create `server/.gitignore`: ignore `.env`, `node_modules`, coverage/log artifacts.
- Create `server/.env.example`: safe template for `MONGODB_URI` and `PORT`.
- Create `server/src/db.js`: MongoDB client connection helpers.
- Create `server/src/seedData.js`: Wuhan/Yichang seed documents extracted from existing HTML pages.
- Create `server/src/repositories/companyRepository.js`: all data access and mutation rules.
- Create `server/src/routes/companyRoutes.js`: company read and edit REST routes.
- Create `server/src/routes/adminRoutes.js`: seed endpoint.
- Create `server/src/app.js`: Express app composition, JSON parsing, routes, static serving, errors.
- Create `server/src/server.js`: process entrypoint.
- Create `server/scripts/seed.js`: CLI seed command.
- Create `server/test/companyRepository.test.js`: repository unit tests using an in-memory fake collection.
- Create `server/test/companyApi.test.js`: API behavior tests using a fake repository injection.
- Create `cleaning.html`: unified frontend page.
- Modify `index.html`: add/link the unified cleaning page, keeping old pages available.

---

### Task 1: Backend Project Skeleton

**Files:**
- Create: `server/package.json`
- Create: `server/.gitignore`
- Create: `server/.env.example`
- Create: `server/src/db.js`
- Create: `server/src/app.js`
- Create: `server/src/server.js`
- Test: `server/test/appSmoke.test.js`

**Interfaces:**
- Produces: `createApp(options?: { repository?: CompanyRepository, staticRoot?: string }): express.Application`
- Produces: `connectToDatabase(uri: string, dbName: string): Promise<{ client: MongoClient, db: Db }>`
- Consumes: no prior task output.

- [ ] **Step 1: Create backend package metadata**

Create `server/package.json`:

```json
{
  "name": "dasaochupaiban-server",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node src/server.js",
    "seed": "node scripts/seed.js",
    "test": "node --test"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "mongodb": "^6.8.0"
  },
  "devDependencies": {
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: Add backend ignore and env template**

Create `server/.gitignore`:

```gitignore
node_modules/
.env
coverage/
npm-debug.log*
```

Create `server/.env.example`:

```text
MONGODB_URI=mongodb://user:password@example-host:27017/?directConnection=true
PORT=3000
```

- [ ] **Step 3: Write a failing smoke test**

Create `server/test/appSmoke.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');
const { createApp } = require('../src/app');

test('GET /api/health returns ok status', async () => {
  const app = createApp({
    repository: {},
    staticRoot: process.cwd()
  });

  const response = await request(app).get('/api/health').expect(200);

  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.database, 'dasaochupaiban');
});
```

- [ ] **Step 4: Run test to verify it fails**

Run:

```bash
cd server
npm install
npm test -- --test-name-pattern "GET /api/health"
```

Expected: FAIL because `../src/app` does not exist.

- [ ] **Step 5: Implement minimal app and database helpers**

Create `server/src/db.js`:

```js
const { MongoClient } = require('mongodb');

async function connectToDatabase(uri, dbName) {
  if (!uri || !uri.trim()) {
    throw new Error('MONGODB_URI is required');
  }

  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(dbName) };
}

module.exports = { connectToDatabase };
```

Create `server/src/app.js`:

```js
const express = require('express');
const path = require('node:path');

function createApp(options = {}) {
  const app = express();
  const staticRoot = options.staticRoot || path.resolve(__dirname, '..', '..');

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', database: 'dasaochupaiban' });
  });

  app.use(express.static(staticRoot));

  app.use((err, _req, res, _next) => {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.code || 'internal_error',
      message: err.message || 'Internal server error'
    });
  });

  return app;
}

module.exports = { createApp };
```

Create `server/src/server.js`:

```js
require('dotenv').config();

const path = require('node:path');
const { createApp } = require('./app');
const { connectToDatabase } = require('./db');

async function main() {
  const port = Number(process.env.PORT || 3000);
  const { client, db } = await connectToDatabase(process.env.MONGODB_URI, 'dasaochupaiban');
  const repository = { db, client };
  const app = createApp({
    repository,
    staticRoot: path.resolve(__dirname, '..', '..')
  });

  const server = app.listen(port, () => {
    console.log(`Dasaochupaiban server listening on http://localhost:${port}`);
  });

  process.on('SIGINT', async () => {
    server.close(async () => {
      await client.close();
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
cd server
npm test -- --test-name-pattern "GET /api/health"
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/.gitignore server/.env.example server/src/db.js server/src/app.js server/src/server.js server/test/appSmoke.test.js
git commit -m "feat: add express backend skeleton"
```

---

### Task 2: Seed Data Documents

**Files:**
- Create: `server/src/seedData.js`
- Create: `server/test/seedData.test.js`

**Interfaces:**
- Produces: `seedCompanies: Array<CompanyDocument>`
- Produces: `getSeedCompanies(): Array<CompanyDocument>`
- Consumes: existing employees and areas from `武汉公司大扫除安排表.html` and `销售部大扫除安排表.html`.

- [ ] **Step 1: Write failing seed data test**

Create `server/test/seedData.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const { getSeedCompanies } = require('../src/seedData');

test('seed data contains Wuhan and Yichang cleaning configuration', () => {
  const companies = getSeedCompanies();
  const keys = companies.map((company) => company.key).sort();

  assert.deepEqual(keys, ['wuhan', 'yichang']);

  const wuhan = companies.find((company) => company.key === 'wuhan');
  assert.ok(wuhan.employees.includes('张新业'));
  assert.ok(wuhan.employees.includes('盛亚娥'));
  assert.equal(wuhan.storageKey, 'whClean2');
  assert.ok(wuhan.areas.some((area) => area.name === '办公区'));
  assert.ok(wuhan.fixedAssignments.some((item) => item.employeeName === '盛亚娥'));

  const yichang = companies.find((company) => company.key === 'yichang');
  assert.ok(yichang.employees.includes('吴思湘'));
  assert.ok(yichang.employees.includes('徐晓辉'));
  assert.equal(yichang.storageKey, 'ycClean2');
  assert.ok(yichang.areas.some((area) => area.name === '大厅'));
  assert.equal(yichang.fixedAssignments.length, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- --test-name-pattern "seed data contains"
```

Expected: FAIL because `src/seedData.js` does not exist.

- [ ] **Step 3: Implement seed data**

Create `server/src/seedData.js`:

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
      {
        areaName: '人事办公室',
        taskName: '人事办公室清洁（固定：盛亚娥）',
        employeeName: '盛亚娥'
      }
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
      '赵春艳', '周广鑫',
      '周红莲'
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
      {
        areaName: '前台',
        taskName: '前台清洁（固定：吴思湘）',
        employeeName: '吴思湘'
      },
      {
        areaName: '大厅角落',
        taskName: '大厅角落清洁（固定：徐晓辉）',
        employeeName: '徐晓辉'
      }
    ]
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getSeedCompanies() {
  return clone(seedCompanies);
}

module.exports = { seedCompanies, getSeedCompanies };
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd server
npm test -- --test-name-pattern "seed data contains"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/seedData.js server/test/seedData.test.js
git commit -m "feat: add cleaning seed data"
```

---

### Task 3: Company Repository and Mutation Rules

**Files:**
- Create: `server/src/repositories/companyRepository.js`
- Create: `server/test/companyRepository.test.js`

**Interfaces:**
- Consumes: `getSeedCompanies()` from `server/src/seedData.js`
- Produces: `createCompanyRepository(collection)`
- Produces methods:
  - `listCompanies(): Promise<Array<{ key, name, subtitle, storageKey }>>`
  - `getCompany(key: string): Promise<CompanyDocument | null>`
  - `seedCompanies(companies: CompanyDocument[]): Promise<void>`
  - `addEmployee(key: string, name: string): Promise<CompanyDocument>`
  - `deleteEmployee(key: string, employeeName: string): Promise<CompanyDocument>`
  - `addArea(key: string, name: string, firstTaskName: string): Promise<CompanyDocument>`
  - `deleteArea(key: string, areaName: string): Promise<CompanyDocument>`
  - `addTask(key: string, areaName: string, taskName: string): Promise<CompanyDocument>`
  - `deleteTask(key: string, areaName: string, taskName: string): Promise<CompanyDocument>`

- [ ] **Step 1: Write failing repository tests**

Create `server/test/companyRepository.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const { createCompanyRepository } = require('../src/repositories/companyRepository');
const { getSeedCompanies } = require('../src/seedData');

function createFakeCollection(initialDocuments = []) {
  const documents = initialDocuments.map((doc) => structuredClone(doc));

  return {
    async find() {
      return {
        sort() {
          return this;
        },
        project() {
          return this;
        },
        async toArray() {
          return documents.map((doc) => structuredClone(doc));
        }
      };
    },
    async findOne(query) {
      const found = documents.find((doc) => doc.key === query.key);
      return found ? structuredClone(found) : null;
    },
    async replaceOne(query, replacement, options) {
      const index = documents.findIndex((doc) => doc.key === query.key);
      if (index >= 0) {
        documents[index] = structuredClone(replacement);
      } else if (options && options.upsert) {
        documents.push(structuredClone(replacement));
      }
      return { acknowledged: true };
    }
  };
}

test('repository lists companies and gets one company', async () => {
  const repository = createCompanyRepository(createFakeCollection(getSeedCompanies()));

  const companies = await repository.listCompanies();
  const wuhan = await repository.getCompany('wuhan');

  assert.deepEqual(companies.map((company) => company.key).sort(), ['wuhan', 'yichang']);
  assert.equal(wuhan.name, '武汉公司');
  assert.ok(wuhan.employees.includes('张新业'));
});

test('repository adds employee and rejects duplicates', async () => {
  const repository = createCompanyRepository(createFakeCollection(getSeedCompanies()));

  const updated = await repository.addEmployee('wuhan', '测试员工');
  assert.ok(updated.employees.includes('测试员工'));

  await assert.rejects(
    () => repository.addEmployee('wuhan', '测试员工'),
    { statusCode: 409, code: 'duplicate_employee' }
  );
});

test('repository refuses deleting fixed assignment employee', async () => {
  const repository = createCompanyRepository(createFakeCollection(getSeedCompanies()));

  await assert.rejects(
    () => repository.deleteEmployee('wuhan', '盛亚娥'),
    { statusCode: 409, code: 'fixed_employee' }
  );
});

test('repository adds area, rejects duplicate area, and deletes area', async () => {
  const repository = createCompanyRepository(createFakeCollection(getSeedCompanies()));

  const added = await repository.addArea('wuhan', '测试区域', '测试任务');
  assert.ok(added.areas.some((area) => area.name === '测试区域'));

  await assert.rejects(
    () => repository.addArea('wuhan', '测试区域', '测试任务2'),
    { statusCode: 409, code: 'duplicate_area' }
  );

  const deleted = await repository.deleteArea('wuhan', '测试区域');
  assert.equal(deleted.areas.some((area) => area.name === '测试区域'), false);
});

test('repository adds and deletes task with duplicate checks', async () => {
  const repository = createCompanyRepository(createFakeCollection(getSeedCompanies()));

  const added = await repository.addTask('wuhan', '办公区', '测试擦窗');
  const area = added.areas.find((item) => item.name === '办公区');
  assert.ok(area.tasks.some((task) => task.name === '测试擦窗'));

  await assert.rejects(
    () => repository.addTask('wuhan', '办公区', '测试擦窗'),
    { statusCode: 409, code: 'duplicate_task' }
  );

  const deleted = await repository.deleteTask('wuhan', '办公区', '测试擦窗');
  const updatedArea = deleted.areas.find((item) => item.name === '办公区');
  assert.equal(updatedArea.tasks.some((task) => task.name === '测试擦窗'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- --test-name-pattern "repository"
```

Expected: FAIL because repository module does not exist.

- [ ] **Step 3: Implement repository**

Create `server/src/repositories/companyRepository.js`:

```js
function createHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function normalizeName(name, fieldName = 'name') {
  if (typeof name !== 'string' || !name.trim()) {
    throw createHttpError(400, 'invalid_name', `${fieldName} is required`);
  }
  return name.trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withUpdatedAt(company) {
  return { ...company, updatedAt: new Date().toISOString() };
}

function createCompanyRepository(collection) {
  async function saveCompany(company) {
    const next = withUpdatedAt(company);
    await collection.replaceOne({ key: next.key }, next, { upsert: true });
    return clone(next);
  }

  async function requireCompany(key) {
    const company = await collection.findOne({ key });
    if (!company) {
      throw createHttpError(404, 'company_not_found', `Company ${key} was not found`);
    }
    return company;
  }

  async function listCompanies() {
    const cursor = await collection.find({});
    const companies = await cursor.sort({ key: 1 }).project({
      _id: 0,
      key: 1,
      name: 1,
      subtitle: 1,
      storageKey: 1
    }).toArray();
    return companies.map((company) => ({
      key: company.key,
      name: company.name,
      subtitle: company.subtitle,
      storageKey: company.storageKey
    }));
  }

  async function getCompany(key) {
    const company = await collection.findOne({ key });
    return company ? clone(company) : null;
  }

  async function seedCompanies(companies) {
    for (const company of companies) {
      await saveCompany(company);
    }
  }

  async function addEmployee(key, name) {
    const employeeName = normalizeName(name, 'employee name');
    const company = await requireCompany(key);
    if (company.employees.includes(employeeName)) {
      throw createHttpError(409, 'duplicate_employee', `${employeeName} already exists`);
    }
    company.employees.push(employeeName);
    return saveCompany(company);
  }

  async function deleteEmployee(key, employeeNameInput) {
    const employeeName = normalizeName(employeeNameInput, 'employee name');
    const company = await requireCompany(key);
    const isFixed = company.fixedAssignments.some((item) => item.employeeName === employeeName);
    if (isFixed) {
      throw createHttpError(409, 'fixed_employee', `${employeeName} is a fixed assignment employee`);
    }
    company.employees = company.employees.filter((item) => item !== employeeName);
    return saveCompany(company);
  }

  async function addArea(key, name, firstTaskName) {
    const areaName = normalizeName(name, 'area name');
    const taskName = normalizeName(firstTaskName, 'first task name');
    const company = await requireCompany(key);
    if (company.areas.some((area) => area.name === areaName)) {
      throw createHttpError(409, 'duplicate_area', `${areaName} already exists`);
    }
    company.areas.push({ name: areaName, tasks: [{ name: taskName }] });
    return saveCompany(company);
  }

  async function deleteArea(key, areaNameInput) {
    const areaName = normalizeName(areaNameInput, 'area name');
    const company = await requireCompany(key);
    company.areas = company.areas.filter((area) => area.name !== areaName);
    company.fixedAssignments = company.fixedAssignments.filter((item) => item.areaName !== areaName);
    return saveCompany(company);
  }

  async function addTask(key, areaNameInput, taskNameInput) {
    const areaName = normalizeName(areaNameInput, 'area name');
    const taskName = normalizeName(taskNameInput, 'task name');
    const company = await requireCompany(key);
    const area = company.areas.find((item) => item.name === areaName);
    if (!area) {
      throw createHttpError(404, 'area_not_found', `${areaName} was not found`);
    }
    if (area.tasks.some((task) => task.name === taskName)) {
      throw createHttpError(409, 'duplicate_task', `${taskName} already exists`);
    }
    area.tasks.push({ name: taskName });
    return saveCompany(company);
  }

  async function deleteTask(key, areaNameInput, taskNameInput) {
    const areaName = normalizeName(areaNameInput, 'area name');
    const taskName = normalizeName(taskNameInput, 'task name');
    const company = await requireCompany(key);
    const area = company.areas.find((item) => item.name === areaName);
    if (!area) {
      throw createHttpError(404, 'area_not_found', `${areaName} was not found`);
    }
    const isFixed = company.fixedAssignments.some((item) => item.areaName === areaName && item.taskName === taskName);
    if (isFixed) {
      throw createHttpError(409, 'fixed_task', `${taskName} is a fixed assignment task`);
    }
    area.tasks = area.tasks.filter((task) => task.name !== taskName);
    company.fixedAssignments = company.fixedAssignments.filter((item) => !(item.areaName === areaName && item.taskName === taskName));
    return saveCompany(company);
  }

  return {
    listCompanies,
    getCompany,
    seedCompanies,
    addEmployee,
    deleteEmployee,
    addArea,
    deleteArea,
    addTask,
    deleteTask
  };
}

module.exports = { createCompanyRepository, createHttpError };
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd server
npm test -- --test-name-pattern "repository"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/repositories/companyRepository.js server/test/companyRepository.test.js
git commit -m "feat: add company repository rules"
```

---

### Task 4: REST API Routes and Seed Command

**Files:**
- Create: `server/src/routes/companyRoutes.js`
- Create: `server/src/routes/adminRoutes.js`
- Create: `server/scripts/seed.js`
- Modify: `server/src/app.js`
- Modify: `server/src/server.js`
- Test: `server/test/companyApi.test.js`

**Interfaces:**
- Consumes: repository methods from Task 3.
- Produces REST endpoints:
  - `GET /api/companies`
  - `GET /api/companies/:key`
  - `POST /api/companies/:key/employees`
  - `DELETE /api/companies/:key/employees/:employeeName`
  - `POST /api/companies/:key/areas`
  - `DELETE /api/companies/:key/areas/:areaName`
  - `POST /api/companies/:key/areas/:areaName/tasks`
  - `DELETE /api/companies/:key/areas/:areaName/tasks/:taskName`
  - `POST /api/admin/seed`

- [ ] **Step 1: Write failing API tests**

Create `server/test/companyApi.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');
const { createApp } = require('../src/app');
const { createCompanyRepository } = require('../src/repositories/companyRepository');
const { getSeedCompanies } = require('../src/seedData');

function createFakeCollection(initialDocuments = []) {
  const documents = initialDocuments.map((doc) => structuredClone(doc));

  return {
    async find() {
      return {
        sort() { return this; },
        project() { return this; },
        async toArray() { return documents.map((doc) => structuredClone(doc)); }
      };
    },
    async findOne(query) {
      const found = documents.find((doc) => doc.key === query.key);
      return found ? structuredClone(found) : null;
    },
    async replaceOne(query, replacement, options) {
      const index = documents.findIndex((doc) => doc.key === query.key);
      if (index >= 0) documents[index] = structuredClone(replacement);
      else if (options && options.upsert) documents.push(structuredClone(replacement));
      return { acknowledged: true };
    }
  };
}

function createTestApp() {
  const repository = createCompanyRepository(createFakeCollection(getSeedCompanies()));
  return createApp({ repository, staticRoot: process.cwd() });
}

test('company API reads companies and one company', async () => {
  const app = createTestApp();

  const list = await request(app).get('/api/companies').expect(200);
  assert.deepEqual(list.body.map((company) => company.key).sort(), ['wuhan', 'yichang']);

  const wuhan = await request(app).get('/api/companies/wuhan').expect(200);
  assert.equal(wuhan.body.name, '武汉公司');
  assert.ok(wuhan.body.employees.includes('张新业'));
});

test('company API mutates employees with conflict responses', async () => {
  const app = createTestApp();

  const added = await request(app)
    .post('/api/companies/wuhan/employees')
    .send({ name: '测试员工' })
    .expect(200);
  assert.ok(added.body.employees.includes('测试员工'));

  const duplicate = await request(app)
    .post('/api/companies/wuhan/employees')
    .send({ name: '测试员工' })
    .expect(409);
  assert.equal(duplicate.body.error, 'duplicate_employee');

  const fixed = await request(app)
    .delete(encodeURI('/api/companies/wuhan/employees/盛亚娥'))
    .expect(409);
  assert.equal(fixed.body.error, 'fixed_employee');
});

test('company API mutates areas and tasks', async () => {
  const app = createTestApp();

  const area = await request(app)
    .post('/api/companies/wuhan/areas')
    .send({ name: '测试区域', firstTaskName: '测试任务' })
    .expect(200);
  assert.ok(area.body.areas.some((item) => item.name === '测试区域'));

  const task = await request(app)
    .post(encodeURI('/api/companies/wuhan/areas/测试区域/tasks'))
    .send({ name: '第二任务' })
    .expect(200);
  const testArea = task.body.areas.find((item) => item.name === '测试区域');
  assert.ok(testArea.tasks.some((item) => item.name === '第二任务'));

  await request(app)
    .delete(encodeURI('/api/companies/wuhan/areas/测试区域/tasks/第二任务'))
    .expect(200);

  await request(app)
    .delete(encodeURI('/api/companies/wuhan/areas/测试区域'))
    .expect(200);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- --test-name-pattern "company API"
```

Expected: FAIL because API routes are not registered.

- [ ] **Step 3: Implement routes**

Create `server/src/routes/companyRoutes.js`:

```js
const express = require('express');

function createCompanyRoutes(repository) {
  const router = express.Router();

  router.get('/companies', async (_req, res, next) => {
    try {
      res.json(await repository.listCompanies());
    } catch (error) {
      next(error);
    }
  });

  router.get('/companies/:key', async (req, res, next) => {
    try {
      const company = await repository.getCompany(req.params.key);
      if (!company) {
        res.status(404).json({ error: 'company_not_found', message: `Company ${req.params.key} was not found` });
        return;
      }
      res.json(company);
    } catch (error) {
      next(error);
    }
  });

  router.post('/companies/:key/employees', async (req, res, next) => {
    try {
      res.json(await repository.addEmployee(req.params.key, req.body.name));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/companies/:key/employees/:employeeName', async (req, res, next) => {
    try {
      res.json(await repository.deleteEmployee(req.params.key, req.params.employeeName));
    } catch (error) {
      next(error);
    }
  });

  router.post('/companies/:key/areas', async (req, res, next) => {
    try {
      res.json(await repository.addArea(req.params.key, req.body.name, req.body.firstTaskName));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/companies/:key/areas/:areaName', async (req, res, next) => {
    try {
      res.json(await repository.deleteArea(req.params.key, req.params.areaName));
    } catch (error) {
      next(error);
    }
  });

  router.post('/companies/:key/areas/:areaName/tasks', async (req, res, next) => {
    try {
      res.json(await repository.addTask(req.params.key, req.params.areaName, req.body.name));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/companies/:key/areas/:areaName/tasks/:taskName', async (req, res, next) => {
    try {
      res.json(await repository.deleteTask(req.params.key, req.params.areaName, req.params.taskName));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createCompanyRoutes };
```

Create `server/src/routes/adminRoutes.js`:

```js
const express = require('express');
const { getSeedCompanies } = require('../seedData');

function createAdminRoutes(repository) {
  const router = express.Router();

  router.post('/admin/seed', async (_req, res, next) => {
    try {
      const companies = getSeedCompanies();
      await repository.seedCompanies(companies);
      res.json({ ok: true, seeded: companies.map((company) => company.key) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createAdminRoutes };
```

- [ ] **Step 4: Wire routes into app and server**

Update `server/src/app.js`:

```js
const express = require('express');
const path = require('node:path');
const { createCompanyRoutes } = require('./routes/companyRoutes');
const { createAdminRoutes } = require('./routes/adminRoutes');

function createApp(options = {}) {
  const app = express();
  const staticRoot = options.staticRoot || path.resolve(__dirname, '..', '..');
  const repository = options.repository;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', database: 'dasaochupaiban' });
  });

  if (repository) {
    app.use('/api', createCompanyRoutes(repository));
    app.use('/api', createAdminRoutes(repository));
  }

  app.use(express.static(staticRoot));

  app.use((err, _req, res, _next) => {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.code || 'internal_error',
      message: err.message || 'Internal server error'
    });
  });

  return app;
}

module.exports = { createApp };
```

Update `server/src/server.js`:

```js
require('dotenv').config();

const path = require('node:path');
const { createApp } = require('./app');
const { connectToDatabase } = require('./db');
const { createCompanyRepository } = require('./repositories/companyRepository');

async function main() {
  const port = Number(process.env.PORT || 3000);
  const { client, db } = await connectToDatabase(process.env.MONGODB_URI, 'dasaochupaiban');
  const repository = createCompanyRepository(db.collection('companies'));
  const app = createApp({
    repository,
    staticRoot: path.resolve(__dirname, '..', '..')
  });

  const server = app.listen(port, () => {
    console.log(`Dasaochupaiban server listening on http://localhost:${port}`);
  });

  process.on('SIGINT', async () => {
    server.close(async () => {
      await client.close();
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 5: Add seed CLI**

Create `server/scripts/seed.js`:

```js
require('dotenv').config();

const { connectToDatabase } = require('../src/db');
const { createCompanyRepository } = require('../src/repositories/companyRepository');
const { getSeedCompanies } = require('../src/seedData');

async function main() {
  const { client, db } = await connectToDatabase(process.env.MONGODB_URI, 'dasaochupaiban');
  try {
    const repository = createCompanyRepository(db.collection('companies'));
    const companies = getSeedCompanies();
    await repository.seedCompanies(companies);
    console.log(`Seeded companies: ${companies.map((company) => company.key).join(', ')}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 6: Run API tests to verify they pass**

Run:

```bash
cd server
npm test -- --test-name-pattern "company API|GET /api/health"
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/companyRoutes.js server/src/routes/adminRoutes.js server/scripts/seed.js server/src/app.js server/src/server.js server/test/companyApi.test.js
git commit -m "feat: add cleaning roster api routes"
```

---

### Task 5: Unified Cleaning Frontend Data Client

**Files:**
- Create: `cleaning.html`
- Create: `server/test/staticPage.test.js`

**Interfaces:**
- Consumes API endpoints from Task 4.
- Produces browser functions:
  - `loadCompanies(): Promise<void>`
  - `loadCompany(key: string): Promise<void>`
  - `apiRequest(path: string, options?: RequestInit): Promise<any>`
  - `getTaskKeys(): string[]`
  - `taskKey(areaName: string, taskName: string): string`
  - `findFixedAssignment(areaName: string, taskName: string): FixedAssignment | undefined`

- [ ] **Step 1: Write failing static page test**

Create `server/test/staticPage.test.js`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('cleaning.html contains unified API-driven page hooks', () => {
  const htmlPath = path.resolve(__dirname, '..', '..', 'cleaning.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.match(html, /id="company-switcher"/);
  assert.match(html, /async function loadCompanies/);
  assert.match(html, /async function loadCompany/);
  assert.match(html, /\/api\/companies/);
  assert.doesNotMatch(html, /const ALL_EMPLOYEES = \[/);
  assert.doesNotMatch(html, /const DEFAULT_AREAS = \{/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- --test-name-pattern "cleaning.html contains"
```

Expected: FAIL because `cleaning.html` does not exist.

- [ ] **Step 3: Create initial unified page shell**

Create `cleaning.html` with the existing visual style adapted from the old cleaning pages, and include these required elements:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>呈尚策划 · 大扫除安排表</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <style>
    :root {
      --ink: #1f2933;
      --muted: #667085;
      --line: #d8ded2;
      --paper: #fffdf8;
      --leaf: #3d5a3e;
      --leaf-2: #5c7c5d;
      --amber: #e8a645;
      --danger: #b45b3c;
      --cream: #f7f1e3;
      --shadow: 0 16px 40px rgba(61, 90, 62, 0.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Noto Sans SC", "Microsoft YaHei", Arial, sans-serif;
      color: var(--ink);
      background: #f4f6ef;
    }
    .app { max-width: 1440px; margin: 0 auto; padding: 24px; }
    .topbar { display: flex; gap: 16px; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .title h1 { margin: 0; font-size: 28px; }
    .title p { margin: 6px 0 0; color: var(--muted); }
    .switcher { display: flex; gap: 8px; padding: 4px; background: #ffffff; border: 1px solid var(--line); border-radius: 8px; }
    .switcher button, .btn {
      border: 1px solid var(--line);
      background: #ffffff;
      color: var(--ink);
      border-radius: 6px;
      padding: 9px 12px;
      cursor: pointer;
      font-weight: 600;
    }
    .switcher button.active, .btn.primary { background: var(--leaf); color: #ffffff; border-color: var(--leaf); }
    .btn.danger { background: var(--danger); color: #ffffff; border-color: var(--danger); }
    .layout { display: grid; grid-template-columns: 320px 1fr; gap: 18px; align-items: start; }
    .panel {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 16px;
    }
    .panel h2 { margin: 0 0 12px; font-size: 18px; }
    .form-row { display: flex; gap: 8px; margin-bottom: 12px; }
    .form-row input {
      flex: 1;
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 9px 10px;
    }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 8px 10px;
      background: #ffffff;
      cursor: pointer;
      user-select: none;
    }
    .chip.fixed { background: #fff3d5; }
    .chip.rest { opacity: .55; }
    .chip button {
      border: 0;
      background: transparent;
      color: var(--danger);
      cursor: pointer;
      font-weight: 700;
    }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .area { margin-bottom: 16px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #ffffff; }
    .area-head { display: flex; justify-content: space-between; gap: 8px; align-items: center; padding: 12px; background: var(--cream); }
    .tasks { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; padding: 12px; }
    .task {
      min-height: 94px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
      background: #fbfcf7;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .assigned { color: var(--leaf); font-weight: 700; }
    .task-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .status { margin: 10px 0; color: var(--muted); min-height: 20px; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .topbar { align-items: stretch; flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="app">
    <section class="topbar">
      <div class="title">
        <h1 id="page-title">大扫除安排表</h1>
        <p id="page-subtitle">正在加载公司数据</p>
      </div>
      <div id="company-switcher" class="switcher"></div>
    </section>

    <div class="layout">
      <aside class="panel">
        <h2>人员名单</h2>
        <form id="employee-form" class="form-row">
          <input id="employee-name" autocomplete="off" placeholder="输入员工姓名" />
          <button class="btn primary" type="submit">新增</button>
        </form>
        <div id="staff-grid" class="chips"></div>

        <h2 style="margin-top:18px;">休息人员</h2>
        <div id="rest-grid" class="chips"></div>

        <h2 style="margin-top:18px;">未分配人员</h2>
        <div id="unassigned-grid" class="chips"></div>
      </aside>

      <section class="panel">
        <div class="toolbar">
          <button class="btn primary" onclick="randomAssign()">随机分配</button>
          <button class="btn" onclick="clearAll()">清空分配</button>
          <button class="btn" onclick="exportExcel()">导出 Excel</button>
        </div>

        <form id="area-form" class="form-row">
          <input id="area-name" autocomplete="off" placeholder="新增区域名称" />
          <input id="area-task-name" autocomplete="off" placeholder="第一个清洁内容" />
          <button class="btn primary" type="submit">新增区域</button>
        </form>

        <div id="status" class="status"></div>
        <div id="task-board"></div>
      </section>
    </div>
  </main>

  <script>
    let companies = [];
    let currentCompany = null;
    let restSet = new Set();
    let assignments = {};

    async function apiRequest(path, options = {}) {
      const response = await fetch(path, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || '请求失败');
      }
      return data;
    }

    async function loadCompanies() {
      companies = await apiRequest('/api/companies');
      renderCompanySwitcher();
      const firstKey = new URLSearchParams(location.search).get('company') || (companies[0] && companies[0].key);
      if (firstKey) await loadCompany(firstKey);
    }

    async function loadCompany(key) {
      currentCompany = await apiRequest(`/api/companies/${encodeURIComponent(key)}`);
      restSet = new Set();
      assignments = {};
      loadLocalState();
      renderAll();
    }

    function renderCompanySwitcher() {
      const switcher = document.getElementById('company-switcher');
      switcher.innerHTML = companies.map((company) => (
        `<button type="button" data-key="${company.key}">${company.name}</button>`
      )).join('');
      switcher.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => loadCompany(button.dataset.key));
      });
    }

    function renderAll() {
      document.getElementById('page-title').textContent = `${currentCompany.name}大扫除安排表`;
      document.getElementById('page-subtitle').textContent = `${currentCompany.subtitle} · ${currentCompany.employees.length} 名员工 · ${getTaskKeys().length} 个清洁任务`;
      document.querySelectorAll('#company-switcher button').forEach((button) => {
        button.classList.toggle('active', button.dataset.key === currentCompany.key);
      });
      renderEmployees();
      renderRest();
      renderTasks();
      renderUnassigned();
      setStatus('');
    }

    function isFixedEmployee(employeeName) {
      return currentCompany.fixedAssignments.some((item) => item.employeeName === employeeName);
    }

    function findFixedAssignment(areaName, taskName) {
      return currentCompany.fixedAssignments.find((item) => item.areaName === areaName && item.taskName === taskName);
    }

    function taskKey(areaName, taskName) {
      return `${areaName}::${taskName}`;
    }

    function getTaskKeys() {
      return currentCompany.areas.flatMap((area) => area.tasks.map((task) => taskKey(area.name, task.name)));
    }

    function renderEmployees() {
      const grid = document.getElementById('staff-grid');
      grid.innerHTML = '';
      currentCompany.employees.forEach((employeeName) => {
        const chip = document.createElement('span');
        chip.className = `chip${isFixedEmployee(employeeName) ? ' fixed' : ''}${restSet.has(employeeName) ? ' rest' : ''}`;
        chip.textContent = employeeName;
        chip.addEventListener('click', () => toggleRest(employeeName));
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'x';
        deleteButton.title = '删除人员';
        deleteButton.addEventListener('click', (event) => {
          event.stopPropagation();
          deleteEmployee(employeeName);
        });
        chip.appendChild(deleteButton);
        grid.appendChild(chip);
      });
    }

    function renderRest() {
      const grid = document.getElementById('rest-grid');
      grid.innerHTML = [...restSet].map((name) => `<span class="chip rest">${name}</span>`).join('') || '<span class="status">暂无休息人员</span>';
    }

    function renderTasks() {
      const board = document.getElementById('task-board');
      board.innerHTML = '';
      currentCompany.areas.forEach((area) => {
        const section = document.createElement('section');
        section.className = 'area';
        section.innerHTML = `
          <div class="area-head">
            <strong>${escapeHtml(area.name)}</strong>
            <div class="task-actions">
              <button class="btn" type="button" data-action="add-task">新增任务</button>
              <button class="btn danger" type="button" data-action="delete-area">删除区域</button>
            </div>
          </div>
          <div class="tasks"></div>
        `;
        section.querySelector('[data-action="add-task"]').addEventListener('click', () => addTask(area.name));
        section.querySelector('[data-action="delete-area"]').addEventListener('click', () => deleteArea(area.name));

        const tasks = section.querySelector('.tasks');
        area.tasks.forEach((task) => {
          const key = taskKey(area.name, task.name);
          const fixed = findFixedAssignment(area.name, task.name);
          if (fixed) assignments[key] = fixed.employeeName;
          const card = document.createElement('article');
          card.className = 'task';
          card.innerHTML = `
            <div>
              <strong>${escapeHtml(task.name)}</strong>
              <div class="assigned">${assignments[key] ? `✓ ${escapeHtml(assignments[key])}` : '未分配'}</div>
            </div>
            <div class="task-actions">
              <button class="btn" type="button" data-action="assign">分配</button>
              <button class="btn" type="button" data-action="clear">取消</button>
              <button class="btn danger" type="button" data-action="delete-task">删除任务</button>
            </div>
          `;
          card.querySelector('[data-action="assign"]').addEventListener('click', () => assignTask(key));
          card.querySelector('[data-action="clear"]').addEventListener('click', () => clearAssignment(key));
          card.querySelector('[data-action="delete-task"]').addEventListener('click', () => deleteTask(area.name, task.name));
          tasks.appendChild(card);
        });
        board.appendChild(section);
      });
      saveLocalState();
    }

    function renderUnassigned() {
      const assigned = new Set(Object.values(assignments));
      const names = currentCompany.employees.filter((name) => !restSet.has(name) && !assigned.has(name));
      document.getElementById('unassigned-grid').innerHTML = names.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join('') || '<span class="status">暂无未分配人员</span>';
    }

    function toggleRest(employeeName) {
      if (isFixedEmployee(employeeName)) {
        setStatus('固定负责人不可设为休息');
        return;
      }
      if (restSet.has(employeeName)) restSet.delete(employeeName);
      else restSet.add(employeeName);
      Object.keys(assignments).forEach((key) => {
        if (assignments[key] === employeeName) delete assignments[key];
      });
      saveLocalState();
      renderAll();
    }

    function assignTask(key) {
      const fixed = currentCompany.fixedAssignments.find((item) => taskKey(item.areaName, item.taskName) === key);
      if (fixed) {
        setStatus('固定任务不可更改');
        return;
      }
      const used = new Set(Object.values(assignments));
      const available = currentCompany.employees.find((name) => !restSet.has(name) && !isFixedEmployee(name) && !used.has(name));
      if (!available) {
        setStatus('暂无可分配人员');
        return;
      }
      assignments[key] = available;
      saveLocalState();
      renderAll();
    }

    function clearAssignment(key) {
      const fixed = currentCompany.fixedAssignments.find((item) => taskKey(item.areaName, item.taskName) === key);
      if (fixed) {
        setStatus('固定任务不可取消');
        return;
      }
      delete assignments[key];
      saveLocalState();
      renderAll();
    }

    function randomAssign() {
      currentCompany.fixedAssignments.forEach((item) => {
        assignments[taskKey(item.areaName, item.taskName)] = item.employeeName;
      });
      const used = new Set(Object.values(assignments));
      const employees = currentCompany.employees.filter((name) => !restSet.has(name) && !used.has(name) && !isFixedEmployee(name));
      const freeTasks = getTaskKeys().filter((key) => !assignments[key]);
      employees.sort(() => Math.random() - 0.5);
      freeTasks.forEach((key, index) => {
        if (employees[index]) assignments[key] = employees[index];
      });
      saveLocalState();
      renderAll();
    }

    function clearAll() {
      assignments = {};
      currentCompany.fixedAssignments.forEach((item) => {
        assignments[taskKey(item.areaName, item.taskName)] = item.employeeName;
      });
      saveLocalState();
      renderAll();
    }

    async function addEmployee(name) {
      const value = name.trim();
      if (!value) return;
      currentCompany = await apiRequest(`/api/companies/${currentCompany.key}/employees`, {
        method: 'POST',
        body: JSON.stringify({ name: value })
      });
      saveLocalState();
      renderAll();
    }

    async function deleteEmployee(employeeName) {
      currentCompany = await apiRequest(`/api/companies/${currentCompany.key}/employees/${encodeURIComponent(employeeName)}`, {
        method: 'DELETE'
      });
      restSet.delete(employeeName);
      Object.keys(assignments).forEach((key) => {
        if (assignments[key] === employeeName) delete assignments[key];
      });
      saveLocalState();
      renderAll();
    }

    async function addArea(name, firstTaskName) {
      currentCompany = await apiRequest(`/api/companies/${currentCompany.key}/areas`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), firstTaskName: firstTaskName.trim() })
      });
      renderAll();
    }

    async function deleteArea(areaName) {
      currentCompany = await apiRequest(`/api/companies/${currentCompany.key}/areas/${encodeURIComponent(areaName)}`, {
        method: 'DELETE'
      });
      saveLocalState();
      renderAll();
    }

    async function addTask(areaName) {
      const name = prompt('请输入清洁内容');
      if (!name || !name.trim()) return;
      currentCompany = await apiRequest(`/api/companies/${currentCompany.key}/areas/${encodeURIComponent(areaName)}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() })
      });
      renderAll();
    }

    async function deleteTask(areaName, taskName) {
      currentCompany = await apiRequest(`/api/companies/${currentCompany.key}/areas/${encodeURIComponent(areaName)}/tasks/${encodeURIComponent(taskName)}`, {
        method: 'DELETE'
      });
      delete assignments[taskKey(areaName, taskName)];
      saveLocalState();
      renderAll();
    }

    function loadLocalState() {
      const raw = localStorage.getItem(currentCompany.storageKey);
      if (!raw) {
        clearAll();
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        assignments = parsed.assignments || {};
        restSet = new Set(parsed.restEmployees || []);
      } catch {
        assignments = {};
        restSet = new Set();
      }
      currentCompany.fixedAssignments.forEach((item) => {
        assignments[taskKey(item.areaName, item.taskName)] = item.employeeName;
      });
    }

    function saveLocalState() {
      if (!currentCompany) return;
      localStorage.setItem(currentCompany.storageKey, JSON.stringify({
        assignments,
        restEmployees: [...restSet]
      }));
    }

    function exportExcel() {
      const rows = [['区域', '清洁内容', '负责人']];
      currentCompany.areas.forEach((area) => {
        area.tasks.forEach((task) => {
          rows.push([area.name, task.name, assignments[taskKey(area.name, task.name)] || '']);
        });
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '大扫除安排');
      XLSX.writeFile(wb, `呈尚策划${currentCompany.name}大扫除安排表.xlsx`);
    }

    function setStatus(message) {
      document.getElementById('status').textContent = message;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char]));
    }

    document.getElementById('employee-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const input = document.getElementById('employee-name');
      try {
        await addEmployee(input.value);
        input.value = '';
      } catch (error) {
        setStatus(error.message);
      }
    });

    document.getElementById('area-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const areaInput = document.getElementById('area-name');
      const taskInput = document.getElementById('area-task-name');
      try {
        await addArea(areaInput.value, taskInput.value);
        areaInput.value = '';
        taskInput.value = '';
      } catch (error) {
        setStatus(error.message);
      }
    });

    loadCompanies().catch((error) => setStatus(error.message));
  </script>
</body>
</html>
```

- [ ] **Step 4: Run static page test to verify it passes**

Run:

```bash
cd server
npm test -- --test-name-pattern "cleaning.html contains"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add cleaning.html server/test/staticPage.test.js
git commit -m "feat: add unified cleaning page"
```

---

### Task 6: Frontend API Error Handling and State Compatibility

**Files:**
- Modify: `cleaning.html`
- Test: `server/test/staticPage.test.js`

**Interfaces:**
- Consumes: `cleaning.html` functions from Task 5.
- Produces: robust user-visible status handling and migration support for existing local storage shapes.

- [ ] **Step 1: Extend static page test for error and local storage hooks**

Modify `server/test/staticPage.test.js`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function readCleaningHtml() {
  return fs.readFileSync(path.resolve(__dirname, '..', '..', 'cleaning.html'), 'utf8');
}

test('cleaning.html contains unified API-driven page hooks', () => {
  const html = readCleaningHtml();

  assert.match(html, /id="company-switcher"/);
  assert.match(html, /async function loadCompanies/);
  assert.match(html, /async function loadCompany/);
  assert.match(html, /\/api\/companies/);
  assert.doesNotMatch(html, /const ALL_EMPLOYEES = \[/);
  assert.doesNotMatch(html, /const DEFAULT_AREAS = \{/);
});

test('cleaning.html handles API errors and legacy localStorage keys', () => {
  const html = readCleaningHtml();

  assert.match(html, /function setStatus/);
  assert.match(html, /parsed\.restEmployees/);
  assert.match(html, /parsed\.rest/);
  assert.match(html, /parsed\.assignments/);
  assert.match(html, /status\.textContent/);
});
```

- [ ] **Step 2: Run test to verify new assertions fail if compatibility is missing**

Run:

```bash
cd server
npm test -- --test-name-pattern "legacy localStorage"
```

Expected: FAIL until `loadLocalState()` supports both `restEmployees` and old `rest` if the Task 5 implementation omitted old-key support.

- [ ] **Step 3: Update `cleaning.html` local storage loader**

In `cleaning.html`, replace `loadLocalState()` with:

```js
function loadLocalState() {
  const raw = localStorage.getItem(currentCompany.storageKey);
  assignments = {};
  restSet = new Set();

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      assignments = parsed.assignments || {};
      restSet = new Set(parsed.restEmployees || parsed.rest || []);
    } catch {
      assignments = {};
      restSet = new Set();
    }
  }

  currentCompany.fixedAssignments.forEach((item) => {
    assignments[taskKey(item.areaName, item.taskName)] = item.employeeName;
  });
}
```

Ensure each async mutation has a `try/catch` at the event-handler boundary and calls `setStatus(error.message)`.

- [ ] **Step 4: Run static page tests**

Run:

```bash
cd server
npm test -- --test-name-pattern "cleaning.html"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add cleaning.html server/test/staticPage.test.js
git commit -m "fix: handle cleaning page api errors"
```

---

### Task 7: Homepage Link

**Files:**
- Modify: `index.html`
- Test: `server/test/staticPage.test.js`

**Interfaces:**
- Consumes: `cleaning.html` from Task 5.
- Produces: homepage link to the unified page while retaining old page links.

- [ ] **Step 1: Add failing homepage link test**

Append to `server/test/staticPage.test.js`:

```js
test('index.html links to unified cleaning page', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', '..', 'index.html'), 'utf8');

  assert.match(html, /cleaning\.html/);
  assert.match(html, /统一大扫除安排表/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd server
npm test -- --test-name-pattern "index.html links"
```

Expected: FAIL because `index.html` does not link to `cleaning.html` yet.

- [ ] **Step 3: Modify `index.html`**

In `index.html`, add a prominent card or update the existing cleaning card button so there is a link:

```html
<a href="cleaning.html" class="card-button">
  <i class="fas fa-broom"></i>
  进入统一大扫除安排表
</a>
```

Keep existing links to `销售部大扫除安排表.html` and `武汉公司大扫除安排表.html` available as fallback entries or secondary text links.

- [ ] **Step 4: Run homepage link test**

Run:

```bash
cd server
npm test -- --test-name-pattern "index.html links"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html server/test/staticPage.test.js
git commit -m "feat: link unified cleaning page"
```

---

### Task 8: Full Backend Test Run and Real MongoDB Seed Verification

**Files:**
- No committed file changes unless prior tasks expose a bug.
- Local only: `server/.env`

**Interfaces:**
- Consumes: all previous backend and frontend work.
- Produces: verified local backend, seeded cloud database, and manual smoke result.

- [ ] **Step 1: Create local env file from `数据库`**

Read the local `数据库` file and create `server/.env` manually with the real connection string:

```text
MONGODB_URI=<real MongoDB connection string from local 数据库 file>
PORT=3000
```

Do not add `server/.env` to Git.

- [ ] **Step 2: Run all automated tests**

Run:

```bash
cd server
npm test
```

Expected: all `node:test` tests pass with exit code 0.

- [ ] **Step 3: Run seed command against cloud MongoDB**

Run:

```bash
cd server
npm run seed
```

Expected output includes:

```text
Seeded companies: wuhan, yichang
```

- [ ] **Step 4: Start backend**

Run:

```bash
cd server
npm start
```

Expected output:

```text
Dasaochupaiban server listening on http://localhost:3000
```

- [ ] **Step 5: Verify APIs manually**

In a second terminal, run:

```bash
Invoke-RestMethod -Uri 'http://localhost:3000/api/health'
Invoke-RestMethod -Uri 'http://localhost:3000/api/companies'
Invoke-RestMethod -Uri 'http://localhost:3000/api/companies/wuhan'
Invoke-RestMethod -Uri 'http://localhost:3000/api/companies/yichang'
```

Expected:

- Health response has `status = ok`.
- Companies include `wuhan` and `yichang`.
- Wuhan employees include `张新业`.
- Yichang fixed assignments include `吴思湘` and `徐晓辉`.

- [ ] **Step 6: Verify unified page manually**

Open:

```text
http://localhost:3000/cleaning.html
```

Manual checks:

- Wuhan loads by default.
- Switching to Yichang updates title, employees, and task board.
- Add a temporary employee named `测试员工`.
- Refresh page and confirm `测试员工` persists.
- Delete `测试员工`.
- Add a temporary area `测试区域` with first task `测试任务`.
- Refresh page and confirm it persists.
- Delete `测试区域`.
- Try deleting fixed employee `盛亚娥` in Wuhan and confirm the page shows an error.
- Run random assignment and confirm assignments render.
- Export Excel and confirm a file downloads.

- [ ] **Step 7: Stop backend**

Stop the `npm start` process with `Ctrl+C`.

- [ ] **Step 8: Commit any verification fixes only**

If manual verification required fixes:

```bash
git add <fixed-files>
git commit -m "fix: verify cloud cleaning workflow"
```

If no fixes were required, do not create an empty commit.

---

### Task 9: Final Repository Verification

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: all implementation tasks.
- Produces: final confidence before push/deployment.

- [ ] **Step 1: Check Git state**

Run:

```bash
git status --short --branch
```

Expected:

- Current branch is ahead by the implementation commits.
- `server/.env` is not listed.
- Existing unrelated untracked files may remain untracked and must not be added accidentally.

- [ ] **Step 2: Run full automated tests**

Run:

```bash
cd server
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Confirm no secret in tracked files**

Run:

```bash
rg -n "mongodb://|mongodb\\+srv://|root:|MONGODB_URI=.*@" --glob "!server/.env" --glob "!数据库"
```

Expected:

- No real MongoDB URI appears in tracked source files.
- `.env.example` may contain only placeholder values.

- [ ] **Step 4: Review final diff**

Run:

```bash
git log --oneline -10
git diff origin/master...HEAD --stat
```

Expected:

- Commits correspond to the planned backend, seed, API, frontend, and homepage changes.
- No unrelated files are included.

- [ ] **Step 5: Push when requested**

Only after user asks to publish:

```bash
git push origin master
```

Expected: remote `master` updates successfully.

---

## Self-Review

- Spec coverage: The plan covers backend creation, MongoDB connection, `dasaochupaiban` seeding, REST APIs, unified frontend, edit controls, homepage link, tests, and real cloud seed verification.
- Placeholder scan: No placeholder markers or unspecified implementation steps remain.
- Type consistency: Repository method names match API route usage; frontend function names match static tests; seed company keys match the spec.
