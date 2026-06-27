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
