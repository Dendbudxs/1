require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { db, getSetting, setSetting } = require('./db');
const {
  signUser,
  setAuthCookie,
  clearAuthCookie,
  authOptional,
  requireAuth,
  requireAdmin,
  getUserById
} = require('./auth');
const { saveDataImage, deleteLocalUpload, uploadsDir } = require('./media');
const {
  isDiscordConfigured,
  createState,
  buildAuthorizeUrl,
  exchangeCode,
  fetchDiscordUser,
  avatarUrl
} = require('./discord');

const app = express();
const PORT = Number(process.env.PORT || 3000);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is missing or shorter than 32 characters. Copy .env.example to .env and set a strong secret.');
  process.exit(1);
}

const trustProxyEnabled = String(process.env.TRUST_PROXY || 'false').toLowerCase() === 'true' || Boolean(process.env.RAILWAY_ENVIRONMENT);
if (trustProxyEnabled) {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://cdn.discordapp.com'],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));
app.use(express.json({ limit: '7mb' }));
app.use(cookieParser());
app.use(authOptional);

// Additional same-origin protection for cookie-authenticated JSON mutations.
app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  const expected = `${req.protocol}://${req.get('host')}`;
  if (origin !== expected) return res.status(403).json({ error: 'ORIGIN_INVALID' });
  next();
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_ATTEMPTS' }
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_ATTEMPTS' }
});

app.use('/api/admin', writeLimiter);

function usernameIsValid(username) {
  return typeof username === 'string' && /^[A-Za-z0-9_]{3,24}$/.test(username);
}

function passwordIsValid(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function cleanText(value, max = 1000) {
  return String(value ?? '').trim().slice(0, max);
}

function boolInt(value) {
  return value === true || value === 1 || value === '1' ? 1 : 0;
}

function enumValue(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function intRange(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function colorValue(value, fallback = '#7b98a3') {
  const color = String(value || '').trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
}

function safeLink(value) {
  const link = cleanText(value, 500);
  if (!link) return '';
  if (link.startsWith('/')) return link;
  try {
    const url = new URL(link);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function userRow(id) {
  return db.prepare(`
    SELECT
      u.id, u.username, u.role, u.local_login_enabled, u.created_at,
      COALESCE(p.display_name, u.username) AS display_name,
      p.avatar_url, COALESCE(p.animations_enabled, 1) AS animations_enabled,
      COALESCE(p.theme_preset, 'graphite') AS theme_preset,
      COALESCE(p.accent_color, '#7b98a3') AS accent_color,
      COALESCE(p.ui_density, 'normal') AS ui_density,
      COALESCE(p.corner_style, 'soft') AS corner_style,
      COALESCE(p.font_preset, 'modern') AS font_preset,
      COALESCE(p.acrylic_blur, 22) AS acrylic_blur,
      COALESCE(p.acrylic_opacity, 74) AS acrylic_opacity,
      COALESCE(p.texture_intensity, 22) AS texture_intensity,
      d.username AS discord_username, d.global_name AS discord_global_name
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN discord_accounts d ON d.user_id = u.id
    WHERE u.id = ?
  `).get(id);
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    avatarUrl: row.avatar_url || null,
    role: row.role,
    animationsEnabled: Number(row.animations_enabled ?? 1) === 1,
    appearance: {
      themePreset: row.theme_preset || 'graphite',
      accentColor: row.accent_color || '#7b98a3',
      uiDensity: row.ui_density || 'normal',
      cornerStyle: row.corner_style || 'soft',
      fontPreset: row.font_preset || 'modern',
      acrylicBlur: Number(row.acrylic_blur ?? 22),
      acrylicOpacity: Number(row.acrylic_opacity ?? 74),
      textureIntensity: Number(row.texture_intensity ?? 22)
    },
    hasLocalPassword: Number(row.local_login_enabled ?? 1) === 1,
    discord: row.discord_username ? {
      username: row.discord_username,
      displayName: row.discord_global_name || row.discord_username
    } : null,
    createdAt: row.created_at
  };
}

function adminUser(row) {
  return row ? {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at
  } : null;
}

async function ensureBootstrapAdmin() {
  const username = (process.env.ADMIN_USERNAME || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!username || !password) return;
  if (!usernameIsValid(username) || !passwordIsValid(password)) {
    console.warn('Bootstrap admin skipped: ADMIN_USERNAME or ADMIN_PASSWORD does not meet validation rules.');
    return;
  }

  const existing = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!existing) {
    const hash = await bcrypt.hash(password, 12);
    const info = db.prepare(`
      INSERT INTO users (username, password_hash, role, local_login_enabled)
      VALUES (?, ?, 'admin', 1)
    `).run(username, hash);
    db.prepare('INSERT OR IGNORE INTO profiles (user_id, display_name) VALUES (?, ?)').run(info.lastInsertRowid, username);
    console.log(`Bootstrap admin created: ${username}`);
  } else {
    if (existing.role !== 'admin') db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
    if (Number(existing.local_login_enabled) !== 1) {
      const hash = await bcrypt.hash(password, 12);
      db.prepare('UPDATE users SET password_hash = ?, local_login_enabled = 1 WHERE id = ?').run(hash, existing.id);
    }
    db.prepare('INSERT OR IGNORE INTO profiles (user_id, display_name) VALUES (?, ?)').run(existing.id, existing.username);
    console.log(`Bootstrap admin ready: ${username}`);
  }
}

function generateUniqueUsername(discordUser) {
  let base = String(discordUser?.username || 'discord_user')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 18);
  if (base.length < 3) base = 'discord_user';

  let candidate = base;
  let attempt = 0;
  while (db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(candidate)) {
    attempt += 1;
    const suffix = `_${String(discordUser.id || crypto.randomInt(1000, 9999)).slice(-4)}${attempt > 1 ? attempt : ''}`;
    candidate = `${base.slice(0, Math.max(3, 24 - suffix.length))}${suffix}`;
  }
  return candidate;
}

// Health check used by Railway and other hosts.
app.get('/api/health', (_req, res) => {
  try {
    db.prepare('SELECT 1 AS ok').get();
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// Public API -----------------------------------------------------------------
app.get('/api/config', (_req, res) => {
  res.json({
    serverIp: getSetting('server_ip', process.env.SITE_SERVER_IP || 'darkgamespro.falix.pro'),
    minecraftVersion: getSetting('minecraft_version', process.env.MINECRAFT_VERSION || '1.21.1'),
    discordConfigured: isDiscordConfigured()
  });
});

app.get('/api/server/status', (_req, res) => {
  res.json({ state: getSetting('server_state', 'offline') });
});

app.get('/api/content/home', (_req, res) => {
  const news = db.prepare(`
    SELECT id, title, excerpt, image_url, published_at, updated_at
    FROM news
    WHERE status = 'published'
    ORDER BY datetime(COALESCE(published_at, updated_at)) DESC, id DESC
    LIMIT 30
  `).all();
  const banners = db.prepare(`
    SELECT id, title, subtitle, image_url, link_url
    FROM banners
    WHERE active = 1
    ORDER BY sort_order ASC, id ASC
    LIMIT 5
  `).all();
  res.json({ news, banners });
});

app.get('/api/content/news/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare(`
    SELECT id, title, excerpt, body, image_url, published_at, updated_at
    FROM news
    WHERE id = ? AND status = 'published'
  `).get(id);
  if (!row) return res.status(404).json({ error: 'NEWS_NOT_FOUND' });
  res.json(row);
});

app.get('/api/content/lore', (_req, res) => {
  const book = db.prepare('SELECT id, title, subtitle, updated_at FROM lore_books ORDER BY id LIMIT 1').get();
  const chapters = book ? db.prepare(`
    SELECT id, category, title, body, sort_order, updated_at
    FROM lore_chapters
    WHERE book_id = ? AND published = 1
    ORDER BY sort_order ASC, id ASC
  `).all(book.id) : [];
  res.json({ book, chapters });
});

app.get('/api/content/rules', (_req, res) => {
  const rules = db.prepare(`
    SELECT id, title, body, sort_order, updated_at
    FROM rules
    WHERE published = 1
    ORDER BY sort_order ASC, id ASC
  `).all();
  res.json({ rules });
});

app.get('/api/contact', (_req, res) => {
  res.json({
    discordHandle: getSetting('developer_discord_handle', process.env.DEVELOPER_DISCORD_HANDLE || '@developer'),
    discordUrl: getSetting('developer_discord_url', process.env.DEVELOPER_DISCORD_URL || '')
  });
});

// Auth -----------------------------------------------------------------------
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const username = cleanText(req.body?.username, 24);
  const password = String(req.body?.password || '');
  if (!usernameIsValid(username)) return res.status(400).json({ error: 'USERNAME_INVALID' });
  if (!passwordIsValid(password)) return res.status(400).json({ error: 'PASSWORD_INVALID' });
  if (db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username)) {
    return res.status(409).json({ error: 'USERNAME_TAKEN' });
  }

  const hash = await bcrypt.hash(password, 12);
  const info = db.prepare(`
    INSERT INTO users (username, password_hash, role, local_login_enabled)
    VALUES (?, ?, 'user', 1)
  `).run(username, hash);
  db.prepare('INSERT INTO profiles (user_id, display_name) VALUES (?, ?)').run(info.lastInsertRowid, username);
  const user = userRow(Number(info.lastInsertRowid));
  setAuthCookie(res, signUser(user));
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const username = cleanText(req.body?.username, 24);
  const password = String(req.body?.password || '');
  const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!user || Number(user.local_login_enabled) !== 1) {
    return res.status(401).json({ error: user ? 'USE_DISCORD' : 'INVALID_CREDENTIALS' });
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
  }
  const full = userRow(user.id);
  setAuthCookie(res, signUser(full));
  res.json({ user: publicUser(full) });
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(userRow(req.user.id)) });
});

app.get('/auth/discord', (req, res) => {
  if (!isDiscordConfigured()) return res.redirect('/account?discord=not-configured');
  const state = createState();
  res.cookie('dark_discord_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: String(process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true',
    maxAge: 10 * 60 * 1000,
    path: '/'
  });
  res.redirect(buildAuthorizeUrl(req, state));
});

app.get('/auth/discord/callback', async (req, res) => {
  const expectedState = req.cookies?.dark_discord_state;
  const state = String(req.query?.state || '');
  const code = String(req.query?.code || '');
  res.clearCookie('dark_discord_state', { path: '/' });

  if (!expectedState || !state || expectedState !== state || !code) {
    return res.redirect('/account?discord=state-error');
  }

  try {
    const token = await exchangeCode(req, code);
    const discordUser = await fetchDiscordUser(token.access_token);
    const existingLink = db.prepare('SELECT * FROM discord_accounts WHERE discord_id = ?').get(String(discordUser.id));
    let localUser;

    if (req.user) {
      if (existingLink && existingLink.user_id !== req.user.id) {
        return res.redirect('/account?discord=already-linked');
      }
      localUser = getUserById(req.user.id);
    } else if (existingLink) {
      localUser = getUserById(existingLink.user_id);
    } else {
      const username = generateUniqueUsername(discordUser);
      const randomHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      const info = db.prepare(`
        INSERT INTO users (username, password_hash, role, local_login_enabled)
        VALUES (?, ?, 'user', 0)
      `).run(username, randomHash);
      const displayName = cleanText(discordUser.global_name || discordUser.username || username, 48) || username;
      db.prepare(`
        INSERT INTO profiles (user_id, display_name, avatar_url)
        VALUES (?, ?, ?)
      `).run(info.lastInsertRowid, displayName, avatarUrl(discordUser));
      localUser = getUserById(Number(info.lastInsertRowid));
    }

    db.prepare(`
      INSERT INTO discord_accounts (user_id, discord_id, username, global_name, avatar_hash, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        discord_id = excluded.discord_id,
        username = excluded.username,
        global_name = excluded.global_name,
        avatar_hash = excluded.avatar_hash,
        updated_at = datetime('now')
    `).run(
      localUser.id,
      String(discordUser.id),
      cleanText(discordUser.username, 80),
      cleanText(discordUser.global_name, 80) || null,
      cleanText(discordUser.avatar, 160) || null
    );

    const profile = db.prepare('SELECT avatar_url FROM profiles WHERE user_id = ?').get(localUser.id);
    if (!profile) {
      db.prepare('INSERT INTO profiles (user_id, display_name, avatar_url) VALUES (?, ?, ?)').run(
        localUser.id,
        cleanText(discordUser.global_name || discordUser.username, 48) || localUser.username,
        avatarUrl(discordUser)
      );
    } else if (!profile.avatar_url) {
      db.prepare('UPDATE profiles SET avatar_url = ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(avatarUrl(discordUser), localUser.id);
    }

    const full = userRow(localUser.id);
    setAuthCookie(res, signUser(full));
    res.redirect(full.role === 'admin' ? '/admin?discord=connected' : '/account?discord=connected');
  } catch (error) {
    console.error('Discord OAuth error:', error.message);
    res.redirect('/account?discord=failed');
  }
});

// Profile --------------------------------------------------------------------
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ user: publicUser(userRow(req.user.id)) });
});

app.patch('/api/profile', requireAuth, (req, res) => {
  const displayName = cleanText(req.body?.displayName, 48);
  if (displayName.length < 2) return res.status(400).json({ error: 'DISPLAY_NAME_INVALID' });
  const animationsEnabled = boolInt(req.body?.animationsEnabled);
  db.prepare(`
    INSERT INTO profiles (user_id, display_name, animations_enabled, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      display_name = excluded.display_name,
      animations_enabled = excluded.animations_enabled,
      updated_at = datetime('now')
  `).run(req.user.id, displayName, animationsEnabled);
  res.json({ user: publicUser(userRow(req.user.id)) });
});

app.patch('/api/profile/personalization', requireAuth, (req, res) => {
  const themePreset = enumValue(req.body?.themePreset, ['graphite', 'obsidian', 'steel', 'warm'], 'graphite');
  const accentColor = colorValue(req.body?.accentColor);
  const uiDensity = enumValue(req.body?.uiDensity, ['compact', 'normal', 'relaxed'], 'normal');
  const cornerStyle = enumValue(req.body?.cornerStyle, ['sharp', 'soft', 'round'], 'soft');
  const fontPreset = enumValue(req.body?.fontPreset, ['modern', 'clean', 'technical'], 'modern');
  const acrylicBlur = intRange(req.body?.acrylicBlur, 0, 32, 22);
  const acrylicOpacity = intRange(req.body?.acrylicOpacity, 45, 92, 74);
  const textureIntensity = intRange(req.body?.textureIntensity, 0, 100, 22);
  const animationsEnabled = boolInt(req.body?.animationsEnabled);

  db.prepare(`
    INSERT INTO profiles (
      user_id, display_name, animations_enabled, theme_preset, accent_color, ui_density,
      corner_style, font_preset, acrylic_blur, acrylic_opacity, texture_intensity, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      animations_enabled = excluded.animations_enabled,
      theme_preset = excluded.theme_preset,
      accent_color = excluded.accent_color,
      ui_density = excluded.ui_density,
      corner_style = excluded.corner_style,
      font_preset = excluded.font_preset,
      acrylic_blur = excluded.acrylic_blur,
      acrylic_opacity = excluded.acrylic_opacity,
      texture_intensity = excluded.texture_intensity,
      updated_at = datetime('now')
  `).run(
    req.user.id, req.user.username, animationsEnabled, themePreset, accentColor, uiDensity,
    cornerStyle, fontPreset, acrylicBlur, acrylicOpacity, textureIntensity
  );

  res.json({ user: publicUser(userRow(req.user.id)) });
});

app.post('/api/profile/avatar', requireAuth, (req, res) => {
  try {
    const current = db.prepare('SELECT avatar_url FROM profiles WHERE user_id = ?').get(req.user.id);
    const newUrl = saveDataImage(req.body?.imageData, `avatar-${req.user.id}`, 2 * 1024 * 1024);
    db.prepare(`
      INSERT INTO profiles (user_id, display_name, avatar_url, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET avatar_url = excluded.avatar_url, updated_at = datetime('now')
    `).run(req.user.id, req.user.username, newUrl);
    if (current?.avatar_url && current.avatar_url !== newUrl) deleteLocalUpload(current.avatar_url);
    res.json({ user: publicUser(userRow(req.user.id)) });
  } catch (error) {
    const code = ['IMAGE_INVALID', 'IMAGE_TYPE_INVALID', 'IMAGE_SIZE_INVALID'].includes(error.message) ? error.message : 'IMAGE_SAVE_FAILED';
    res.status(400).json({ error: code });
  }
});

app.delete('/api/profile/avatar', requireAuth, (req, res) => {
  const current = db.prepare('SELECT avatar_url FROM profiles WHERE user_id = ?').get(req.user.id);
  if (current?.avatar_url) deleteLocalUpload(current.avatar_url);
  db.prepare('UPDATE profiles SET avatar_url = NULL, updated_at = datetime(\'now\') WHERE user_id = ?').run(req.user.id);
  res.json({ user: publicUser(userRow(req.user.id)) });
});

app.post('/api/profile/password', requireAuth, authLimiter, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  if (!passwordIsValid(newPassword)) return res.status(400).json({ error: 'PASSWORD_INVALID' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (Number(user.local_login_enabled) === 1) {
    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ error: 'CURRENT_PASSWORD_INVALID' });
    }
  } else {
    const hasDiscord = db.prepare('SELECT 1 FROM discord_accounts WHERE user_id = ?').get(user.id);
    if (!hasDiscord) return res.status(400).json({ error: 'PASSWORD_SETUP_NOT_ALLOWED' });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ?, local_login_enabled = 1 WHERE id = ?').run(hash, user.id);
  res.json({ user: publicUser(userRow(user.id)) });
});

app.delete('/api/profile/discord', requireAuth, (req, res) => {
  const user = db.prepare('SELECT local_login_enabled FROM users WHERE id = ?').get(req.user.id);
  if (Number(user.local_login_enabled) !== 1) return res.status(400).json({ error: 'SET_PASSWORD_BEFORE_DISCONNECT' });
  db.prepare('DELETE FROM discord_accounts WHERE user_id = ?').run(req.user.id);
  res.json({ user: publicUser(userRow(req.user.id)) });
});

// Admin overview --------------------------------------------------------------
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const users = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const admins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count;
  const publishedNews = db.prepare("SELECT COUNT(*) AS count FROM news WHERE status = 'published'").get().count;
  const chapters = db.prepare('SELECT COUNT(*) AS count FROM lore_chapters').get().count;
  const latestNews = db.prepare('SELECT id, title, updated_at, status FROM news ORDER BY datetime(updated_at) DESC, id DESC LIMIT 1').get() || null;
  res.json({
    users,
    admins,
    publishedNews,
    chapters,
    latestNews,
    serverState: getSetting('server_state', 'offline')
  });
});

// Admin news ------------------------------------------------------------------
app.get('/api/admin/news', requireAdmin, (_req, res) => {
  res.json({ news: db.prepare('SELECT * FROM news ORDER BY datetime(updated_at) DESC, id DESC').all() });
});

app.post('/api/admin/news', requireAdmin, (req, res) => {
  try {
    const title = cleanText(req.body?.title, 140);
    const excerpt = cleanText(req.body?.excerpt, 320);
    const body = cleanText(req.body?.body, 50000);
    const status = req.body?.status === 'published' ? 'published' : 'draft';
    if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
    let imageUrl = null;
    if (req.body?.imageData) imageUrl = saveDataImage(req.body.imageData, 'news', 4 * 1024 * 1024);
    const info = db.prepare(`
      INSERT INTO news (title, excerpt, body, image_url, status, published_at, updated_by)
      VALUES (?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN datetime('now') ELSE NULL END, ?)
    `).run(title, excerpt, body, imageUrl, status, status, req.user.id);
    res.status(201).json(db.prepare('SELECT * FROM news WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) {
    res.status(400).json({ error: error.message.startsWith('IMAGE_') ? error.message : 'NEWS_SAVE_FAILED' });
  }
});

app.put('/api/admin/news/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'NEWS_NOT_FOUND' });
  try {
    const title = cleanText(req.body?.title, 140);
    const excerpt = cleanText(req.body?.excerpt, 320);
    const body = cleanText(req.body?.body, 50000);
    const status = req.body?.status === 'published' ? 'published' : 'draft';
    if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
    let imageUrl = current.image_url;
    if (req.body?.removeImage) imageUrl = null;
    if (req.body?.imageData) imageUrl = saveDataImage(req.body.imageData, `news-${id}`, 4 * 1024 * 1024);
    db.prepare(`
      UPDATE news SET
        title = ?, excerpt = ?, body = ?, image_url = ?, status = ?,
        published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, datetime('now')) ELSE published_at END,
        updated_at = datetime('now'), updated_by = ?
      WHERE id = ?
    `).run(title, excerpt, body, imageUrl, status, status, req.user.id, id);
    if (current.image_url && current.image_url !== imageUrl) deleteLocalUpload(current.image_url);
    res.json(db.prepare('SELECT * FROM news WHERE id = ?').get(id));
  } catch (error) {
    res.status(400).json({ error: error.message.startsWith('IMAGE_') ? error.message : 'NEWS_SAVE_FAILED' });
  }
});

app.delete('/api/admin/news/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare('SELECT image_url FROM news WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'NEWS_NOT_FOUND' });
  db.prepare('DELETE FROM news WHERE id = ?').run(id);
  deleteLocalUpload(current.image_url);
  res.json({ ok: true });
});

// Admin lore ------------------------------------------------------------------
app.get('/api/admin/lore', requireAdmin, (_req, res) => {
  const book = db.prepare('SELECT * FROM lore_books ORDER BY id LIMIT 1').get();
  const chapters = book ? db.prepare('SELECT * FROM lore_chapters WHERE book_id = ? ORDER BY sort_order ASC, id ASC').all(book.id) : [];
  res.json({ book, chapters });
});

app.put('/api/admin/lore/book', requireAdmin, (req, res) => {
  const book = db.prepare('SELECT * FROM lore_books ORDER BY id LIMIT 1').get();
  if (!book) return res.status(404).json({ error: 'BOOK_NOT_FOUND' });
  const title = cleanText(req.body?.title, 120);
  const subtitle = cleanText(req.body?.subtitle, 280);
  if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
  db.prepare('UPDATE lore_books SET title = ?, subtitle = ?, updated_at = datetime(\'now\') WHERE id = ?').run(title, subtitle, book.id);
  res.json(db.prepare('SELECT * FROM lore_books WHERE id = ?').get(book.id));
});

app.post('/api/admin/lore/chapters', requireAdmin, (req, res) => {
  const book = db.prepare('SELECT * FROM lore_books ORDER BY id LIMIT 1').get();
  if (!book) return res.status(404).json({ error: 'BOOK_NOT_FOUND' });
  const title = cleanText(req.body?.title, 140);
  const body = cleanText(req.body?.body, 70000);
  const category = ['history', 'regions', 'cities', 'characters', 'mechanics'].includes(req.body?.category) ? req.body.category : 'history';
  if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
  const max = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS value FROM lore_chapters WHERE book_id = ?').get(book.id).value;
  const info = db.prepare(`
    INSERT INTO lore_chapters (book_id, category, title, body, sort_order, published, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(book.id, category, title, body, Number(max) + 10, boolInt(req.body?.published), req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM lore_chapters WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/admin/lore/chapters/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM lore_chapters WHERE id = ?').get(id)) return res.status(404).json({ error: 'CHAPTER_NOT_FOUND' });
  const title = cleanText(req.body?.title, 140);
  const body = cleanText(req.body?.body, 70000);
  const category = ['history', 'regions', 'cities', 'characters', 'mechanics'].includes(req.body?.category) ? req.body.category : 'history';
  if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
  db.prepare(`
    UPDATE lore_chapters SET category = ?, title = ?, body = ?, published = ?, updated_at = datetime('now'), updated_by = ?
    WHERE id = ?
  `).run(category, title, body, boolInt(req.body?.published), req.user.id, id);
  res.json(db.prepare('SELECT * FROM lore_chapters WHERE id = ?').get(id));
});

app.delete('/api/admin/lore/chapters/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM lore_chapters WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) return res.status(404).json({ error: 'CHAPTER_NOT_FOUND' });
  res.json({ ok: true });
});

app.put('/api/admin/lore/reorder', requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isInteger) : [];
  if (!ids.length) return res.status(400).json({ error: 'ORDER_INVALID' });
  db.exec('BEGIN');
  try {
    const stmt = db.prepare('UPDATE lore_chapters SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?');
    ids.forEach((id, index) => stmt.run((index + 1) * 10, id));
    db.exec('COMMIT');
    res.json({ ok: true });
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
});

// Admin rules -----------------------------------------------------------------
app.get('/api/admin/rules', requireAdmin, (_req, res) => {
  res.json({ rules: db.prepare('SELECT * FROM rules ORDER BY sort_order ASC, id ASC').all() });
});

app.post('/api/admin/rules', requireAdmin, (req, res) => {
  const title = cleanText(req.body?.title, 140);
  const body = cleanText(req.body?.body, 30000);
  if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
  const max = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS value FROM rules').get().value;
  const info = db.prepare(`
    INSERT INTO rules (title, body, sort_order, published, updated_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, body, Number(max) + 10, boolInt(req.body?.published), req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM rules WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/admin/rules/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM rules WHERE id = ?').get(id)) return res.status(404).json({ error: 'RULE_NOT_FOUND' });
  const title = cleanText(req.body?.title, 140);
  const body = cleanText(req.body?.body, 30000);
  if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
  db.prepare(`
    UPDATE rules SET title = ?, body = ?, published = ?, updated_at = datetime('now'), updated_by = ? WHERE id = ?
  `).run(title, body, boolInt(req.body?.published), req.user.id, id);
  res.json(db.prepare('SELECT * FROM rules WHERE id = ?').get(id));
});

app.delete('/api/admin/rules/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM rules WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) return res.status(404).json({ error: 'RULE_NOT_FOUND' });
  res.json({ ok: true });
});

app.put('/api/admin/rules/reorder/all', requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isInteger) : [];
  if (!ids.length) return res.status(400).json({ error: 'ORDER_INVALID' });
  db.exec('BEGIN');
  try {
    const stmt = db.prepare('UPDATE rules SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?');
    ids.forEach((id, index) => stmt.run((index + 1) * 10, id));
    db.exec('COMMIT');
    res.json({ ok: true });
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
});

// Admin banners ---------------------------------------------------------------
app.get('/api/admin/banners', requireAdmin, (_req, res) => {
  res.json({ banners: db.prepare('SELECT * FROM banners ORDER BY sort_order ASC, id ASC').all() });
});

app.post('/api/admin/banners', requireAdmin, (req, res) => {
  try {
    const title = cleanText(req.body?.title, 120);
    const subtitle = cleanText(req.body?.subtitle, 280);
    if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
    const linkUrl = safeLink(req.body?.linkUrl);
    let imageUrl = null;
    if (req.body?.imageData) imageUrl = saveDataImage(req.body.imageData, 'banner', 4 * 1024 * 1024);
    const max = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS value FROM banners').get().value;
    const info = db.prepare(`
      INSERT INTO banners (title, subtitle, image_url, link_url, active, sort_order, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, subtitle, imageUrl, linkUrl || null, boolInt(req.body?.active), Number(max) + 10, req.user.id);
    res.status(201).json(db.prepare('SELECT * FROM banners WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) {
    res.status(400).json({ error: error.message.startsWith('IMAGE_') ? error.message : 'BANNER_SAVE_FAILED' });
  }
});

app.put('/api/admin/banners/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'BANNER_NOT_FOUND' });
  try {
    const title = cleanText(req.body?.title, 120);
    const subtitle = cleanText(req.body?.subtitle, 280);
    if (!title) return res.status(400).json({ error: 'TITLE_INVALID' });
    let imageUrl = current.image_url;
    if (req.body?.removeImage) imageUrl = null;
    if (req.body?.imageData) imageUrl = saveDataImage(req.body.imageData, `banner-${id}`, 4 * 1024 * 1024);
    const linkUrl = safeLink(req.body?.linkUrl);
    db.prepare(`
      UPDATE banners SET title = ?, subtitle = ?, image_url = ?, link_url = ?, active = ?, updated_at = datetime('now'), updated_by = ?
      WHERE id = ?
    `).run(title, subtitle, imageUrl, linkUrl || null, boolInt(req.body?.active), req.user.id, id);
    if (current.image_url && current.image_url !== imageUrl) deleteLocalUpload(current.image_url);
    res.json(db.prepare('SELECT * FROM banners WHERE id = ?').get(id));
  } catch (error) {
    res.status(400).json({ error: error.message.startsWith('IMAGE_') ? error.message : 'BANNER_SAVE_FAILED' });
  }
});

app.delete('/api/admin/banners/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare('SELECT image_url FROM banners WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'BANNER_NOT_FOUND' });
  db.prepare('DELETE FROM banners WHERE id = ?').run(id);
  deleteLocalUpload(current.image_url);
  res.json({ ok: true });
});

// Admin users/settings --------------------------------------------------------
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id DESC LIMIT 300').all();
  res.json({ users: users.map(adminUser) });
});

app.patch('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const role = String(req.body?.role || '');
  if (!Number.isInteger(id) || !['user', 'admin'].includes(role)) return res.status(400).json({ error: 'ROLE_INVALID' });
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!target) return res.status(404).json({ error: 'USER_NOT_FOUND' });
  if (id === req.user.id && role !== 'admin') return res.status(400).json({ error: 'CANNOT_DEMOTE_SELF' });
  if (target.role === 'admin' && role === 'user') {
    const admins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count;
    if (admins <= 1) return res.status(400).json({ error: 'LAST_ADMIN' });
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  res.json({ user: adminUser(db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id)) });
});

app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  res.json({
    serverState: getSetting('server_state', 'offline'),
    serverIp: getSetting('server_ip', ''),
    minecraftVersion: getSetting('minecraft_version', ''),
    developerDiscordHandle: getSetting('developer_discord_handle', '@developer'),
    developerDiscordUrl: getSetting('developer_discord_url', '')
  });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const serverState = ['offline', 'online', 'maintenance'].includes(req.body?.serverState) ? req.body.serverState : null;
  if (!serverState) return res.status(400).json({ error: 'SERVER_STATE_INVALID' });
  const serverIp = cleanText(req.body?.serverIp, 120);
  const minecraftVersion = cleanText(req.body?.minecraftVersion, 40);
  const developerDiscordHandle = cleanText(req.body?.developerDiscordHandle, 100);
  const developerDiscordUrl = safeLink(req.body?.developerDiscordUrl);
  setSetting('server_state', serverState);
  setSetting('server_ip', serverIp);
  setSetting('minecraft_version', minecraftVersion);
  setSetting('developer_discord_handle', developerDiscordHandle || '@developer');
  setSetting('developer_discord_url', developerDiscordUrl);
  res.json({ ok: true });
});

// SPA/static ------------------------------------------------------------------
const publicDir = path.join(__dirname, '..', 'public');

// User-generated media lives in DATA_DIR/uploads so one persistent Railway Volume
// can preserve both SQLite and uploaded images across deploys.
app.use('/uploads', express.static(uploadsDir, {
  fallthrough: true,
  maxAge: '1d',
  immutable: false
}));

app.use(express.static(publicDir, {
  extensions: ['html']
}));

app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
});

ensureBootstrapAdmin().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DARK Games v5.3.1 running on http://0.0.0.0:${PORT}`);
    if (!isDiscordConfigured()) console.log('Discord OAuth is disabled until DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are set.');
  });
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
