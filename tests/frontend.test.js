const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('public/index.html', 'utf8');
const script = fs.readFileSync('public/app.js', 'utf8').replace(/boot\(\);\s*$/, '');
function setup(t, url = 'http://localhost/') {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  dom.window.scrollTo = () => {};
  dom.window.AbortSignal.timeout = () => undefined;
  dom.window.eval(script);
  return dom.window;
}
test('one failed public request preserves news and retry recovers lore', async t => {
  const w = setup(t); let fail = true;
  w.fetch = async url => {
    if (url.endsWith('/lore') && fail) throw new Error('Network unavailable');
    const payload = {
      '/api/config': { serverIp: 'example.test', minecraftVersion: '1.21.1' },
      '/api/server/status': { state: 'online' },
      '/api/content/home': { news: [{ id: 1, title: 'Visible news', body: 'Text' }], banners: [] },
      '/api/content/lore': { book: { title: 'Recovered lore' }, chapters: [] },
      '/api/content/rules': { rules: [] }, '/api/contact': {}
    }[url];
    return { ok: true, json: async () => payload };
  };
  await w.refreshPublic();
  assert.match(w.document.querySelector('#newsList').textContent, /Visible news/);
  assert.ok(w.document.querySelector('#load-error-lore'));
  assert.equal(w.document.querySelector('#heroStatusText').textContent, 'Сервер онлайн');
  fail = false; await w.loadPublicSection('lore');
  assert.equal(w.document.querySelector('#load-error-lore'), null);
  assert.equal(w.document.querySelector('#loreBookTitle').textContent, 'Recovered lore');
});
test('chapter deep link, search and onboarding route', async t => {
  const w = setup(t, 'http://localhost/lore#chapter-2');
  w.fetch = async () => ({ ok: true, json: async () => ({ book: { title: 'Книга' }, chapters: [{ id: 1, title: 'Истоки', body: 'История', category: 'history' }, { id: 2, title: 'Город', body: 'Площадь', category: 'cities' }] }) });
  await w.loadPublicSection('lore');
  assert.equal(w.document.querySelector('#loreReader h2').textContent, 'Город');
  const search = w.document.querySelector('#loreSearch');
  search.value = 'история'; search.dispatchEvent(new w.Event('input'));
  assert.equal(w.document.querySelectorAll('#loreToc button').length, 1);
  assert.equal(w.document.querySelector('#loreReader h2').textContent, 'Истоки');
  search.value = 'does-not-exist'; search.dispatchEvent(new w.Event('input'));
  assert.equal(w.document.querySelector('#loreReader h2').textContent, 'Главы не найдены');
  await w.navigate('/play');
  assert.equal(w.document.querySelector('.page.active').dataset.page, 'play');
  await w.navigate('/not-a-page');
  assert.equal(w.document.querySelector('.page.active').dataset.page, 'notfound');
});
