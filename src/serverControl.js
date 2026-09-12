const { getSetting, setSetting } = require('./db');

// Reserved for a future Minecraft hosting provider integration.
// v5 only exposes manual public status through CMS, but this adapter is kept
// so real server control can be added later without redesigning the backend.
async function providerPower(action) {
  const mode = (process.env.SERVER_CONTROL_MODE || 'mock').toLowerCase();

  if (!['start', 'stop'].includes(action)) {
    throw new Error('Unsupported power action.');
  }

  if (mode === 'mock') {
    setSetting('server_state', action === 'start' ? 'online' : 'offline');
    return { ok: true, mode: 'mock', state: getSetting('server_state') };
  }

  if (mode !== 'generic') {
    throw new Error('SERVER_CONTROL_MODE must be mock or generic.');
  }

  const url = process.env.SERVER_CONTROL_URL;
  const token = process.env.SERVER_CONTROL_TOKEN;
  if (!url || !token) {
    throw new Error('SERVER_CONTROL_URL and SERVER_CONTROL_TOKEN are required in generic mode.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action }),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Provider returned ${response.status}${text ? `: ${text.slice(0, 180)}` : ''}`);
    }

    setSetting('server_state', action === 'start' ? 'online' : 'offline');
    return { ok: true, mode: 'generic', state: getSetting('server_state') };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { providerPower };
