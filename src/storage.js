const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');

function resolveProjectPath(value, fallback) {
  if (!value) return fallback;
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

const dataDir = resolveProjectPath(
  process.env.DATA_DIR,
  path.join(projectRoot, 'data')
);

const dbPath = resolveProjectPath(
  process.env.DB_PATH,
  path.join(dataDir, 'dark-games.db')
);

const uploadsDir = resolveProjectPath(
  process.env.UPLOADS_DIR,
  path.join(dataDir, 'uploads')
);

const legacyUploadsDir = path.join(projectRoot, 'public', 'uploads');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

function migrateLegacyUploads() {
  if (path.resolve(legacyUploadsDir) === path.resolve(uploadsDir)) return 0;
  if (!fs.existsSync(legacyUploadsDir)) return 0;

  let copied = 0;
  for (const entry of fs.readdirSync(legacyUploadsDir, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name === '.gitkeep') continue;
    if (!/\.(png|jpe?g|webp)$/i.test(entry.name)) continue;

    const source = path.join(legacyUploadsDir, entry.name);
    const target = path.join(uploadsDir, entry.name);
    if (fs.existsSync(target)) continue;

    try {
      fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
      copied += 1;
    } catch {
      // Best effort migration only. Existing uploads continue to work through the legacy static folder.
    }
  }
  return copied;
}

module.exports = {
  projectRoot,
  dataDir,
  dbPath,
  uploadsDir,
  legacyUploadsDir,
  migrateLegacyUploads
};
