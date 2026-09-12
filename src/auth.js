const jwt = require('jsonwebtoken');
const { db } = require('./db');

function getSecret() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }
  return secret;
}

function signUser(user) {
  return jwt.sign(
    { sub: String(user.id) },
    getSecret(),
    { expiresIn: '7d', issuer: 'dark-games' }
  );
}

function cookieOptions() {
  const secure = process.env.COOKIE_SECURE === undefined
    ? process.env.NODE_ENV === 'production'
    : String(process.env.COOKIE_SECURE).toLowerCase() === 'true';

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

function setAuthCookie(res, token) {
  res.cookie('dark_token', token, cookieOptions());
}

function clearAuthCookie(res) {
  const opts = cookieOptions();
  delete opts.maxAge;
  res.clearCookie('dark_token', opts);
}

function getUserById(id) {
  return db.prepare(`
    SELECT id, username, role, local_login_enabled, created_at
    FROM users
    WHERE id = ?
  `).get(id);
}

function authOptional(req, _res, next) {
  const token = req.cookies?.dark_token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, getSecret(), { issuer: 'dark-games' });
    const user = getUserById(Number(payload.sub));
    if (user) {
      req.auth = payload;
      req.user = user;
    }
  } catch {
    req.auth = null;
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'AUTH_REQUIRED' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'AUTH_REQUIRED' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'ADMIN_REQUIRED' });
  next();
}

module.exports = {
  signUser,
  setAuthCookie,
  clearAuthCookie,
  authOptional,
  requireAuth,
  requireAdmin,
  getUserById,
  cookieOptions
};
