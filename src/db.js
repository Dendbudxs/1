const { DatabaseSync } = require('node:sqlite');
const { dbPath } = require('./storage');

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

function tableExists(name) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?").get(name));
}

function columnExists(table, column) {
  if (!tableExists(table)) return false;
  return db.prepare(`PRAGMA table_info(${table})`).all().some((row) => row.name === column);
}

function ensureColumn(table, column, definition) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
    local_login_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    animations_enabled INTEGER NOT NULL DEFAULT 1,
    theme_preset TEXT NOT NULL DEFAULT 'graphite',
    accent_color TEXT NOT NULL DEFAULT '#7b98a3',
    ui_density TEXT NOT NULL DEFAULT 'normal',
    corner_style TEXT NOT NULL DEFAULT 'soft',
    font_preset TEXT NOT NULL DEFAULT 'modern',
    acrylic_blur INTEGER NOT NULL DEFAULT 22,
    acrylic_opacity INTEGER NOT NULL DEFAULT 74,
    texture_intensity INTEGER NOT NULL DEFAULT 22,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS discord_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    discord_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    global_name TEXT,
    avatar_hash TEXT,
    connected_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    style_variant TEXT NOT NULL DEFAULT 'chronicle',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER,
    FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS lore_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lore_chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'history' CHECK (category IN ('history','regions','cities','characters','mechanics')),
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER,
    FOREIGN KEY(book_id) REFERENCES lore_books(id) ON DELETE CASCADE,
    FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER,
    FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    link_url TEXT,
    style_variant TEXT NOT NULL DEFAULT 'spotlight',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_by INTEGER,
    FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrations from earlier DARK versions.
ensureColumn('users', 'session_version', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'local_login_enabled', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'last_seen_at', 'TEXT');
ensureColumn('profiles', 'theme_preset', "TEXT NOT NULL DEFAULT 'graphite'");
ensureColumn('profiles', 'accent_color', "TEXT NOT NULL DEFAULT '#7b98a3'");
ensureColumn('profiles', 'ui_density', "TEXT NOT NULL DEFAULT 'normal'");
ensureColumn('profiles', 'corner_style', "TEXT NOT NULL DEFAULT 'soft'");
ensureColumn('profiles', 'font_preset', "TEXT NOT NULL DEFAULT 'modern'");
ensureColumn('profiles', 'acrylic_blur', 'INTEGER NOT NULL DEFAULT 22');
ensureColumn('profiles', 'acrylic_opacity', 'INTEGER NOT NULL DEFAULT 74');
ensureColumn('profiles', 'texture_intensity', 'INTEGER NOT NULL DEFAULT 22');
ensureColumn('news', 'style_variant', "TEXT NOT NULL DEFAULT 'chronicle'");
ensureColumn('banners', 'style_variant', "TEXT NOT NULL DEFAULT 'spotlight'");

db.exec('CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at)');

db.prepare(`
  INSERT OR IGNORE INTO profiles (user_id, display_name)
  SELECT id, username FROM users
`).run();

function getSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `).run(key, String(value));
}

function seedSetting(key, value) {
  if (value === undefined || value === null) return;
  db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
}

seedSetting('server_state', getSetting('server_power', 'offline'));
seedSetting('server_ip', process.env.SITE_SERVER_IP || 'darkgamespro.falix.pro');
seedSetting('minecraft_version', process.env.MINECRAFT_VERSION || '1.21.1');
seedSetting('developer_discord_handle', process.env.DEVELOPER_DISCORD_HANDLE || '@developer');
seedSetting('developer_discord_url', process.env.DEVELOPER_DISCORD_URL || '');

let book = db.prepare('SELECT * FROM lore_books ORDER BY id LIMIT 1').get();
if (!book) {
  const info = db.prepare('INSERT INTO lore_books (title, subtitle) VALUES (?, ?)').run(
    'Книга мира',
    'История, регионы, города, персонажи и механики DARK.'
  );
  book = db.prepare('SELECT * FROM lore_books WHERE id = ?').get(info.lastInsertRowid);
}

// Preserve lore written in v1-v4 if this database is reused.
if (tableExists('content')) {
  const chapterCount = db.prepare('SELECT COUNT(*) AS count FROM lore_chapters').get().count;
  if (chapterCount === 0) {
    const legacyLore = db.prepare("SELECT title, body, updated_by FROM content WHERE key = 'lore'").get();
    if (legacyLore && String(legacyLore.body || '').trim()) {
      db.prepare(`
        INSERT INTO lore_chapters (book_id, category, title, body, sort_order, published, updated_by)
        VALUES (?, 'history', ?, ?, 10, 1, ?)
      `).run(book.id, legacyLore.title || 'Архив мира', legacyLore.body, legacyLore.updated_by || null);
    }
  }
}

// A fresh installation should not look empty, but this is intentionally easy to delete in CMS.
const newsCount = db.prepare('SELECT COUNT(*) AS count FROM news').get().count;
if (newsCount === 0) {
  db.prepare(`
    INSERT INTO news (title, excerpt, body, status, published_at)
    VALUES (?, ?, ?, 'published', datetime('now'))
  `).run(
    'Проект готовится к запуску',
    'DARK получил новый сайт и систему управления контентом.',
    'Здесь будут появляться новости сервера, изменения мира и важные объявления команды. Эту запись можно изменить или удалить в панели администратора.'
  );
}

function closeDatabase() {
  try {
    db.close();
  } catch {
    // Best effort during process shutdown.
  }
}

module.exports = {
  db,
  dbPath,
  getSetting,
  setSetting,
  tableExists,
  columnExists,
  closeDatabase
};
