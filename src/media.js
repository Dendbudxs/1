const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { uploadsDir, migrateLegacyUploads } = require('./storage');

const migratedUploads = migrateLegacyUploads();
if (migratedUploads > 0) {
  console.log(`Migrated ${migratedUploads} legacy upload(s) into persistent storage.`);
}

const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
};

function saveDataImage(dataUrl, prefix = 'image', maxBytes = 4 * 1024 * 1024) {
  if (!dataUrl) return null;
  if (typeof dataUrl !== 'string') throw new Error('IMAGE_INVALID');

  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('IMAGE_TYPE_INVALID');

  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > maxBytes) throw new Error('IMAGE_SIZE_INVALID');

  const ext = MIME_EXT[mime];
  const safePrefix = String(prefix).replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'image';
  const filename = `${safePrefix}-${crypto.randomUUID()}.${ext}`;
  const target = path.join(uploadsDir, filename);
  fs.writeFileSync(target, buffer, { flag: 'wx' });
  return `/uploads/${filename}`;
}

function deleteLocalUpload(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const filename = path.basename(url);
  const target = path.join(uploadsDir, filename);
  try {
    fs.unlinkSync(target);
  } catch {
    // Missing old image is harmless.
  }
}

module.exports = { saveDataImage, deleteLocalUpload, uploadsDir };
