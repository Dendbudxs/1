(function (root) {
  'use strict';
  const keysFrom = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.';
  const keysTo = 'йцукенгшщзхъфывапролджэячсмитьбю';
  function normalize(value) {
    return String(value || '').toLocaleLowerCase('ru').replace(/ё/g, 'е')
      .replace(/scp[\s-]*/g, 'scp ').replace(/сцп[\s-]*/g, 'scp ')
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  }
  function keyboard(value) {
    return [...value.toLowerCase()].map(c => { const i = keysFrom.indexOf(c); return i < 0 ? c : keysTo[i]; }).join('');
  }
  function searchable(record) {
    return normalize([record.title,record.categoryLabel,record.group,record.subcategory,
      record.preview,record.description,...(record.parts || []).flatMap(p => [p.text,p.displayText]),record.name,record.nickname,
      record.role,record.steamId,record.discordId,record.text,record.reason].filter(Boolean).join(' '));
  }
  function matches(record, query) {
    const text = searchable(record);
    return [normalize(query),normalize(keyboard(query))].some(q => q && q.split(' ').every(t => text.includes(t)));
  }
  function rank(record, query) {
    const t = normalize(record.title || record.name), q = normalize(query);
    return (t === q ? 100 : t.startsWith(q) ? 60 : t.includes(q) ? 30 : 1) + (record.shelf === 'catalog' ? 10 : 0);
  }
  function search(records, query) {
    if (!normalize(query)) return records.slice();
    return records.filter(r => matches(r,query)).sort((a,b) => rank(b,query)-rank(a,query));
  }
  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function plural(n, forms) {
    const r = n%100, u = n%10;
    return forms[r > 10 && r < 20 ? 2 : u === 1 ? 0 : u >= 2 && u <= 4 ? 1 : 2];
  }
  const api = {normalize,keyboard,searchable,matches,search,escape,plural};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MRP = api;
})(typeof window !== 'undefined' ? window : globalThis);
