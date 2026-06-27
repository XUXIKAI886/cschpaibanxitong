# Vercel Cloud Scheduling System Design

## Goal

Move the current GitHub-static scheduling project to Vercel, add Vercel-hosted backend APIs connected to the MongoDB cloud database `dasaochupaiban`, seed all existing local configuration into MongoDB, and update the three homepage entries so they load and save data through APIs.

The three homepage entries remain:

- `排班表系统.html`
- 宜昌大扫除入口, routed to `cleaning.html?company=yichang`
- 武汉大扫除入口, routed to `cleaning.html?company=wuhan`

## Current Context

The project is currently a static HTML application deployed from GitHub. `index.html` is the homepage and links to three independent pages:

- `排班表系统.html`
- `销售部大扫除安排表.html`
- `武汉公司大扫除安排表.html`

The current static-only shape cannot support cloud database writes on GitHub Pages. After backend APIs are introduced, the project should be deployed to Vercel instead of GitHub Pages.

Current data locations:

- `排班表系统.html` hardcodes six employees:
  - `杨有淇`
  - `陈吉舒`
  - `王涛`
  - `王清月`
  - `袁丽妮`
  - `陈冉`
- `排班表系统.html` hardcodes `dayNames` as `星期一` through `星期天`.
- `排班表系统.html` saves generated schedules to browser `localStorage` key `schedule_v2`.
- `武汉公司大扫除安排表.html` hardcodes Wuhan employees, cleaning areas, tasks, and fixed assignments.
- `销售部大扫除安排表.html` hardcodes Yichang employees, cleaning areas, tasks, and fixed assignments.

The local `数据库` file contains a MongoDB connection string. The real connection string must stay out of Git and be configured through local `.env` and Vercel environment variables.

## Chosen Approach

Use Vercel as the single deployment target:

- Static HTML/CSS/JS pages are served by Vercel.
- Backend APIs live under the repository root `api/` directory as Vercel Functions.
- Shared database, repository, seed, and routing code lives under `lib/`.
- MongoDB connection uses `process.env.MONGODB_URI`.
- The database name is `dasaochupaiban`.
- A root `package.json` defines dependencies, tests, local seed, and Vercel dev scripts.

This replaces the earlier standalone Express-server deployment idea. Vercel Functions are request-driven and scale without a persistent Node server, which fits the new deployment target.

## Vercel Deployment Model

Project type:

- Framework preset: `Other`.
- Build command: none.
- Static output: repository root, or `public` if a later implementation chooses to move static files.
- API functions: files in root `api/`.
- Environment variable: `MONGODB_URI`.

Recommended files:

- `package.json`
- `vercel.json`
- `api/index.js`
- `lib/apiHandler.js`
- `lib/db.js`
- `lib/seedData.js`
- `lib/repositories/companyRepository.js`
- `lib/repositories/scheduleRepository.js`
- `scripts/seed.js`

`api/index.js` will be a single Vercel Function used as the API entrypoint. `vercel.json` will rewrite `/api/*` requests to that function, and `lib/apiHandler.js` will dispatch by method and path. This avoids creating many small function files and keeps shared code outside `api/`.

## MongoDB Data Model

MongoDB database: `dasaochupaiban`

### Collection: `companies`

One document per cleaning company:

```json
{
  "key": "wuhan",
  "name": "武汉公司",
  "subtitle": "武汉清洁任务分配系统",
  "storageKey": "whClean2",
  "employees": ["王娟", "王盼"],
  "areas": [
    {
      "name": "办公区",
      "tasks": [
        { "name": "地面吸尘" },
        { "name": "擦桌椅及摆放" }
      ]
    }
  ],
  "fixedAssignments": [
    {
      "areaName": "人事办公室",
      "taskName": "人事办公室清洁（固定：盛亚娥）",
      "employeeName": "盛亚娥"
    }
  ],
  "updatedAt": "2026-06-27T00:00:00.000Z"
}
```

Company keys:

- `wuhan`
- `yichang`

### Collection: `scheduleSystems`

One document for the existing operations schedule page:

```json
{
  "key": "operations",
  "name": "排班表系统",
  "storageKey": "schedule_v2",
  "employees": ["杨有淇", "陈吉舒", "王涛", "王清月", "袁丽妮", "陈冉"],
  "dayNames": ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期天"],
  "defaultSelectedDayIndexes": [5, 6],
  "rules": {
    "sundayWorkCount": 2,
    "twoDayComplement": true
  },
  "updatedAt": "2026-06-27T00:00:00.000Z"
}
```

The operations schedule employee list and day names move from hardcoded JavaScript into this collection.

### Collection: `scheduleRecords`

Stores saved schedule tables from `排班表系统.html`:

```json
{
  "systemKey": "operations",
  "version": 1,
  "rows": [
    {
      "name": "杨有淇",
      "schedule": ["", "", "", "", "", "work", "rest"]
    }
  ],
  "createdAt": "2026-06-27T00:00:00.000Z",
  "updatedAt": "2026-06-27T00:00:00.000Z"
}
```

For this version, the page only needs the latest saved record. Historical records can remain in the collection for future use, but the API will expose a latest-save workflow.

## Seed Data Source

The seed command writes the current repository data into MongoDB:

- Wuhan cleaning data from current `武汉公司大扫除安排表.html`
  - Employees include `张新业`.
  - Areas and tasks come from current `DEFAULT_AREAS`.
  - Fixed assignments come from current `FIXED_MAP`.
- Yichang cleaning data from current `销售部大扫除安排表.html`
  - Employees come from current `ALL_EMPLOYEES`.
  - Areas and tasks come from current `DEFAULT_AREAS`.
  - Fixed assignments come from current `FIXED_MAP`.
- Operations schedule data from current `排班表系统.html`
  - Employees: `杨有淇`, `陈吉舒`, `王涛`, `王清月`, `袁丽妮`, `陈冉`.
  - Days: `星期一` through `星期天`.
  - Default selected days: Saturday and Sunday, indexes `[5, 6]`.
  - Rules: Sunday has exactly two workers; two-day schedules use complement rules.

## API Design

Base path on Vercel and locally:

```text
/api
```

Health and seed:

```text
GET  /api/health
POST /api/admin/seed
```

Cleaning company APIs:

```text
GET    /api/companies
GET    /api/companies/:key

POST   /api/companies/:key/employees
DELETE /api/companies/:key/employees/:employeeName

POST   /api/companies/:key/areas
DELETE /api/companies/:key/areas/:areaName

POST   /api/companies/:key/areas/:areaName/tasks
DELETE /api/companies/:key/areas/:areaName/tasks/:taskName
```

Operations schedule APIs:

```text
GET    /api/schedule-systems/:key
POST   /api/schedule-systems/:key/employees
DELETE /api/schedule-systems/:key/employees/:employeeName

GET    /api/schedule-systems/:key/records/latest
POST   /api/schedule-systems/:key/records
```

Request body examples:

```json
{ "name": "张三" }
```

for adding an employee.

```json
{ "name": "办公区", "firstTaskName": "地面吸尘" }
```

for adding a cleaning area.

```json
{ "name": "擦桌椅" }
```

for adding a cleaning task.

```json
{
  "rows": [
    {
      "name": "杨有淇",
      "schedule": ["", "", "", "", "", "work", "rest"]
    }
  ]
}
```

for saving an operations schedule record.

Behavior rules:

- Unknown keys return `404`.
- Duplicate employee names, area names, or task names return `409`.
- Missing or blank names return `400`.
- Deleting a cleaning employee who owns a fixed assignment returns `409`.
- Deleting a cleaning area also deletes all tasks in that area.
- `POST /api/schedule-systems/:key/records` validates each row name against the schedule system employee list.
- No authentication is required. Anyone who can access the deployed Vercel site can call edit APIs.
- Mutation responses return the updated document or saved record.

## Frontend Design

### Homepage

`index.html` keeps three entry cards:

- Operations schedule card links to `排班表系统.html`.
- Yichang cleaning card links to `cleaning.html?company=yichang`.
- Wuhan cleaning card links to `cleaning.html?company=wuhan`.

The old standalone cleaning pages remain in the repository as fallback files during migration, but the homepage should point users to the API-backed unified cleaning page.

### Unified Cleaning Page

Create `cleaning.html`:

- Reads company summaries from `GET /api/companies`.
- Reads the selected company from `GET /api/companies/:key`.
- Uses `company` query parameter to choose `wuhan` or `yichang`.
- Renders employees, areas, tasks, and fixed assignments from MongoDB.
- Allows adding and deleting employees, areas, and tasks through API calls.
- Keeps daily rest/assignment state in browser `localStorage` using each company's `storageKey`.
- Keeps random assignment and Excel export browser-side.

### Operations Schedule Page

Update `排班表系统.html`:

- Remove hard dependency on hardcoded `employees` for rendering.
- Load employees, day names, default selected days, and rules from `GET /api/schedule-systems/operations`.
- Render the table after API data loads.
- Keep random schedule generation in the browser, using API-provided rules.
- Change `saveSchedule()` to call `POST /api/schedule-systems/operations/records`.
- On page load, call `GET /api/schedule-systems/operations/records/latest` and restore the latest saved schedule if present.
- Keep Excel export and screenshot copy browser-side.
- Optionally keep a local fallback only for API-load failure messaging, not as the primary data source.

## Testing Strategy

Automated tests should cover:

- `GET /api/health`.
- Seed data includes both cleaning companies and the operations schedule system.
- Cleaning company read, employee add/delete, duplicate conflicts, fixed employee delete rejection, area add/delete, task add/delete.
- Operations schedule config read.
- Operations schedule employee add/delete and duplicate conflict.
- Operations schedule record save and latest read.
- Vercel API handler routes by method and path.
- Static HTML checks:
  - `index.html` links to `cleaning.html?company=yichang` and `cleaning.html?company=wuhan`.
  - `排班表系统.html` contains API load/save hooks and no longer relies on a hardcoded employee list as the primary source.
  - `cleaning.html` contains API load/edit hooks.

Manual verification should cover:

- Run `vercel dev`.
- Run the seed command locally against MongoDB.
- Open `http://localhost:3000/index.html`.
- Enter all three homepage cards.
- In `排班表系统.html`, confirm employees load from API, generate a schedule, save it, refresh, and confirm the latest saved record restores.
- In `cleaning.html?company=wuhan`, confirm Wuhan data includes `张新业`.
- In `cleaning.html?company=yichang`, confirm Yichang fixed assignments include `吴思湘` and `徐晓辉`.
- Add and delete a temporary employee in both cleaning and schedule systems.
- Add and delete a temporary cleaning area and task.
- Confirm Excel export still works in both page types.

## Deployment Plan

1. Add root Node/Vercel project files.
2. Add Vercel API function and shared `lib/` modules.
3. Add seed data and seed script.
4. Seed MongoDB database `dasaochupaiban`.
5. Add `cleaning.html`.
6. Update `排班表系统.html` to use schedule APIs.
7. Update `index.html` to keep three entries but point cleaning cards to `cleaning.html?company=...`.
8. Configure `MONGODB_URI` in Vercel Project Settings.
9. Deploy to Vercel.
10. Stop relying on GitHub Pages for the live app.

## Security and Operational Constraints

- Do not commit the real MongoDB connection string.
- Do not commit `.env`, `.env.local`, or Vercel local environment files.
- Configure `MONGODB_URI` in Vercel environment variables.
- No authentication is required for this version by explicit product decision.
- Because there is no authentication, deploy only where public edits are acceptable or behind Vercel/project-level access controls.
- Keep old cleaning HTML files until the unified page is verified.
- Do not break the homepage's three-entry structure.

## References

- Vercel Functions: https://vercel.com/docs/functions
- Vercel Node.js Runtime: https://vercel.com/docs/functions/runtimes/node-js
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Vercel Build Configuration: https://vercel.com/docs/builds/configure-a-build
- Vercel Project Configuration: https://vercel.com/docs/project-configuration/vercel-json

## Open Decisions Resolved

- Deployment target: Vercel, not GitHub Pages.
- Backend shape: Vercel Functions under `/api`, not a standalone persistent Express server.
- Frontend shape: keep homepage with three project entries.
- Cleaning page shape: one unified API-backed `cleaning.html`, selected by query parameter.
- Operations schedule page: existing `排班表系统.html` stays as the entry, but loads config and saved records from the backend API.
- Edit protection: no password or login for this version.
