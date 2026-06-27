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
