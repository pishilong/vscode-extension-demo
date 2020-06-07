const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const DB_FILE_PATH = 'work-kit.db.json';

function connectDB() {
  const adapter = new FileSync(DB_FILE_PATH);
  return low(adapter);
}

const db = connectDB();

export default db;
