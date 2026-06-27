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
    ),
    seedRepositories: {
      async seedAll({ companies, scheduleSystem }) {
        const now = new Date().toISOString();
        for (const company of companies) {
          await db.collection('companies').replaceOne(
            { key: company.key },
            { ...company, updatedAt: now },
            { upsert: true }
          );
        }
        await db.collection('scheduleSystems').replaceOne(
          { key: scheduleSystem.key },
          { ...scheduleSystem, updatedAt: now },
          { upsert: true }
        );
      }
    }
  });
};
