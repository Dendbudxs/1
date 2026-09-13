const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
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

async function saveDataImage(dataUrl, prefix = 'image', maxBytes = 4 * 1024 * 1024) {
  if (!dataUrl) return null;
  if (typeof dataUrl !== 'string') throw new Error('IMAGE_INVALID');

  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('IMAGE_TYPE_INVALID');

  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > maxBytes) throw new Error('IMAGE_SIZE_INVALID');

  let encoded;
  try {
    const image = sharp(buffer, { limitInputPixels: 16000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['png', 'jpeg', 'webp'].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error('Unsupported image');
    encoded = await image.rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (encoded.length > maxBytes) throw new Error('Image too large');
  } catch { throw new Error('IMAGE_INVALID'); }
  const ext = 'webp';
  const safePrefix = String(prefix).replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'image';
  const filename = `${safePrefix}-${crypto.randomUUID()}.${ext}`;
  const target = path.join(uploadsDir, filename);
  await fs.promises.writeFile(target, encoded, { flag: 'wx' });
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
