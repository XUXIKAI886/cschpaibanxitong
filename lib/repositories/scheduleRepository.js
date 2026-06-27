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
