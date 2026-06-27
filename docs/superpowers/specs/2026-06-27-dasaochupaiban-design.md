# Dasaochupaiban Cloud API Design

## Goal

Build a Node.js/Express backend connected to the MongoDB cloud database `dasaochupaiban`, migrate the current Wuhan and Yichang cleaning roster configuration into MongoDB, and add one unified frontend page that reads and edits employees, cleaning areas, and cleaning tasks through backend APIs.

## Current Context

The project is currently a static HTML application. The Wuhan and Yichang cleaning systems are separate self-contained HTML files:

- `武汉公司大扫除安排表.html`
- `销售部大扫除安排表.html`

Each page hardcodes its own employees, cleaning areas, cleaning tasks, and fixed assignments in JavaScript. Browser-only state such as current assignments and rest employees is saved in `localStorage`.

The local `数据库` file contains a MongoDB connection string. The real connection string must stay out of Git and be moved into a local `.env` file when implementation begins.

## Chosen Approach

Use a standalone Node.js/Express backend with the official MongoDB driver or Mongoose, and add one unified frontend page, `cleaning.html`.

The backend will:

- Read `MONGODB_URI` from `.env`.
- Connect to the MongoDB database named `dasaochupaiban`.
- Store one document per company in a `companies` collection.
- Expose REST APIs for reading companies and editing employees, areas, and tasks.
- Provide a seed command and seed API to initialize MongoDB from the current static HTML data.

The frontend will:

- Load company data from the backend instead of hardcoded arrays.
- Let the user switch between Wuhan and Yichang.
- Let the user add and delete employees, areas, and tasks directly from the page.
- Keep existing browser-side assignment behavior: rest employees, current task assignments, random assignment, and export continue to use local browser state.

The old Wuhan and Yichang HTML files stay in the repository as fallback pages during the migration.

## Data Model

MongoDB database: `dasaochupaiban`

Collection: `companies`

One company document:

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

Seed data source:

- Wuhan employees: current `ALL_EMPLOYEES` in `武汉公司大扫除安排表.html`, including `张新业`.
- Yichang employees: current `ALL_EMPLOYEES` in `销售部大扫除安排表.html`.
- Cleaning areas and tasks: current `DEFAULT_AREAS` in each HTML file.
- Fixed assignments: current `FIXED_MAP` in each HTML file.

## API Design

Base URL during local development: `http://localhost:3000`

```text
GET    /api/health
GET    /api/companies
GET    /api/companies/:key

POST   /api/companies/:key/employees
DELETE /api/companies/:key/employees/:employeeName

POST   /api/companies/:key/areas
DELETE /api/companies/:key/areas/:areaName

POST   /api/companies/:key/areas/:areaName/tasks
DELETE /api/companies/:key/areas/:areaName/tasks/:taskName

POST   /api/admin/seed
```

Expected request bodies:

```json
{ "name": "张三" }
```

for adding an employee.

```json
{ "name": "办公区", "firstTaskName": "地面吸尘" }
```

for adding an area.

```json
{ "name": "擦桌椅" }
```

for adding a task.

Behavior rules:

- Unknown company keys return `404`.
- Duplicate employee names, area names, or task names return `409`.
- Missing or blank names return `400`.
- Deleting an employee who is a fixed assignment owner returns `409`.
- Deleting an area also deletes all tasks in that area.
- No authentication is required. Anyone who can access the backend can call edit APIs.
- API responses should return the updated company document after successful mutations.

## Frontend Design

Create a new unified page:

- `cleaning.html`

The page will have:

- A company switcher for `武汉公司` and `宜昌公司`.
- A people management section showing employees from `GET /api/companies/:key`.
- Add/delete controls for employees.
- A cleaning task table rendered from `areas[].tasks`.
- Add/delete controls for areas.
- Add/delete controls for tasks inside each area.
- Existing assignment interactions adapted from the old pages:
  - Mark employee as resting.
  - Assign employee to task.
  - Clear assignment.
  - Random assignment.
  - Export to Excel.
  - Show unassigned employees.

State split:

- Cloud database stores base configuration: employees, areas, tasks, fixed assignments.
- Browser `localStorage` stores session/workday state: rest employees and current task assignments.

Local storage keys:

- Use each company's `storageKey` from the API.
- Keep current keys where possible: `whClean2` and `ycClean2`.

## Backend File Layout

Planned files:

- `server/package.json`
- `server/.env.example`
- `server/src/app.js`
- `server/src/server.js`
- `server/src/db.js`
- `server/src/seedData.js`
- `server/src/repositories/companyRepository.js`
- `server/src/routes/companyRoutes.js`
- `server/src/routes/adminRoutes.js`
- `server/scripts/seed.js`
- `server/test/companyApi.test.js`

The repository root can keep static HTML files. Express can serve the project root as static files during local development so `cleaning.html` can call `/api/...` from the same origin.

## Migration Plan

1. Add backend project files under `server/`.
2. Create `.env.example` with:

   ```text
   MONGODB_URI=mongodb://user:password@example-host:27017/?directConnection=true
   PORT=3000
   ```

3. Create a local `.env` from the existing `数据库` file. Do not commit `.env`.
4. Add `seedData.js` containing the current Wuhan and Yichang company data.
5. Add `npm run seed` to upsert the two company documents into MongoDB.
6. Add REST APIs and tests.
7. Add `cleaning.html` and wire it to the APIs.
8. Update `index.html` to link to the unified cleaning page while keeping old pages available.

## Testing Strategy

Backend automated tests should cover:

- `GET /api/health` returns healthy status.
- `GET /api/companies` returns company summaries.
- `GET /api/companies/wuhan` returns Wuhan employees and areas.
- Adding a new employee succeeds.
- Adding a duplicate employee returns `409`.
- Deleting a fixed assignment employee returns `409`.
- Adding an area with first task succeeds.
- Adding a duplicate area returns `409`.
- Adding and deleting a task succeeds.

Manual verification should cover:

- Start the backend with the local MongoDB connection.
- Run the seed command and confirm both company documents exist.
- Open `http://localhost:3000/cleaning.html`.
- Switch between Wuhan and Yichang.
- Add and delete a non-fixed employee.
- Add and delete an area.
- Add and delete a task.
- Refresh the page and confirm edited base data is loaded from MongoDB.
- Use rest, assignment, random assignment, and export workflows.

## Security and Operational Constraints

- Do not commit the real MongoDB connection string.
- Do not commit `.env`.
- No authentication is required for this version by explicit product decision.
- Because there is no authentication, deploy only in a trusted environment or behind private access controls.
- Keep old HTML files until the unified page is verified.
- Avoid changing unrelated scheduling pages.

## Open Decisions Resolved

- Backend shape: standalone Node.js/Express.
- Frontend shape: one unified cleaning page for Wuhan and Yichang.
- Edit protection: no password or login for this version.
- Cloud state scope: base configuration only; daily assignment state stays in browser local storage.
