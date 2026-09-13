// Run while the application is stopped to keep database and media consistent.
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { dbPath, uploadsDir, dataDir } = require('../src/storage');
const parent = path.resolve(process.argv[2] || path.join(__dirname, '..', 'backups'));
if (parent === dataDir || parent.startsWith(dataDir + path.sep)) throw new Error('Choose a backup directory outside DATA_DIR.');
const target = path.join(parent, new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(target, { recursive: true });
const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  db.prepare('VACUUM INTO ?').run(path.join(target, 'dark-games.db'));
  fs.cpSync(uploadsDir, path.join(target, 'uploads'), { recursive: true });
  fs.writeFileSync(path.join(target, 'COMPLETE.txt'), 'Backup completed. Restore only with the application stopped.\n');
  console.log(`Backup saved: ${target}`);
} finally { db.close(); }
