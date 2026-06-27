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
