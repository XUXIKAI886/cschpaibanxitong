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
