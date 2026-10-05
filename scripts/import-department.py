"""Build the department snapshot from connector-read Docs and Sheets JSON."""
import json
import re
import sys
from pathlib import Path

source = json.loads(Path(sys.argv[1]).read_text())
root = Path(__file__).resolve().parents[1]
doc_url = 'https://docs.google.com/document/d/' + source['document']['documentId'] + '/edit'
labels = {
    't.0': ('about', 'О руководстве'),
    't.osepb01p428q': ('manual', 'Руководство администрации'),
    't.wsi8msrumrc3': ('aspects', 'Рабочие аспекты'),
    't.ninhlnt5csd': ('names', 'Фамилии и позывные'),
    't.nl1nh2v9waij': ('events', 'Ивенты'),
    't.ab7d7vdp5noc': ('links', 'Ссылки и документы'),
}

def link_url(link, tab):
    if link.get('url', '').startswith(('https://', 'http://')):
        return link['url']
    if 'heading' in link:
        h = link['heading']
        return doc_url + '?tab=' + h.get('tabId', tab) + '#heading=' + h['id']
    if 'tabId' in link:
        return doc_url + '?tab=' + link['tabId']
    return None

def blocks(items, tab):
    result = []
    for item in items:
        if 'table' in item:
            result.append({'type': 'table', 'rows': [[blocks(c.get('content', []), tab) for c in r['tableCells']] for r in item['table']['tableRows']]})
        if 'paragraph' not in item:
            continue
        p = item['paragraph']
        runs = []
        for e in p.get('elements', []):
            if 'textRun' not in e:
                continue
            text = e['textRun']['content']
            style = e['textRun'].get('textStyle', {})
            r = {'text': text}
            if style.get('bold'): r['bold'] = True
            if style.get('italic'): r['italic'] = True
            url = link_url(style.get('link', {}), tab)
            if url: r['url'] = url
            runs.append(r)
        text = ''.join(r['text'] for r in runs)
        if not text.strip():
            continue
        b = {'type': 'paragraph', 'text': text, 'runs': runs}
        style = p.get('paragraphStyle', {}).get('namedStyleType', '')
        if style.startswith('HEADING_'):
            b['level'] = int(style.split('_')[1])
        if 'bullet' in p:
            b['bullet'] = True
            b['indent'] = p['bullet'].get('nestingLevel', 0)
        result.append(b)
    return result

def plain(bs):
    return '\n'.join(b['text'] if b['type'] == 'paragraph' else '\n'.join(plain(c) for row in b['rows'] for c in row) for b in bs)

instructions = []
groups = []
for tab in source['document']['tabs']:
    if tab['tabId'] not in labels:
        continue
    group, label = labels[tab['tabId']]
    groups.append({'id': group, 'label': label})
    chunks = []
    current = {'title': label, 'blocks': []}
    for b in blocks(tab.get('body', {}).get('content', []), tab['tabId']):
        if b.get('level') == 1 and re.match(r'^\d+\.\s', b['text'].strip()):
            if current['blocks']: chunks.append(current)
            current = {'title': b['text'].strip(), 'blocks': []}
        else:
            current['blocks'].append(b)
    if current['blocks']: chunks.append(current)
    for n, chapter in enumerate(chunks, 1):
        chapter.update(id=f'guide-{group}-{n}', group=label, groupId=group, sourceUrl=doc_url + '?tab=' + tab['tabId'])
        chapter['text'] = plain(chapter['blocks'])
        instructions.append(chapter)

def people(sheet, kind):
    out = []
    for row in source[sheet]:
        cells = row['cells']
        vals = [(c.get('formattedValue') or '') for c in cells]
        vals += [''] * (8 - len(vals))
        if row['row'] <= 3 or not vals[1].strip(): continue
        r = {'id': kind + '-' + str(row['row']), 'sourceRow': row['row'], 'number': vals[0], 'name': vals[1], 'nickname': vals[1], 'steamId': vals[2], 'text': '\n'.join(vals), 'cells': [{'text': v, **({'url': cells[i]['hyperlink']} if i < len(cells) and cells[i].get('hyperlink') else {}), **({'note': cells[i]['note']} if i < len(cells) and cells[i].get('note') else {})} for i, v in enumerate(vals[:8 if kind == 'violator' else 7])]}
        if kind == 'violator':
            r.update(bans=vals[3], reason=vals[4], minimumBan=vals[5], registered=vals[6], lastBan=vals[7], archived=True)
        else:
            r.update(discordName=vals[3], discordId=vals[4], warnings=vals[5], roleDate=vals[6])
        out.append(r)
    return out

result = {
    'instructions': instructions, 'guideGroups': groups, 'leadership': [],
    'violators': people('violators', 'violator'), 'veterans': people('veterans', 'veteran'),
    'departmentSources': {
        'importedAt': '2026-10-03',
        'guide': {'title': source['document']['title'], 'url': doc_url, 'attentionUrl': doc_url + '?tab=t.bjx2ajc4ll5f', 'rosterUrl': 'https://docs.google.com/spreadsheets/u/0/d/1Va2jHQKFym-DEQ8_uDThi8ocJ6ucgNHh1eGAihMBMzo/edit'},
        'violators': {'url': 'https://docs.google.com/spreadsheets/d/1qSHi_KsynjxbB-xVZ0xyfZNbNg8N8aEBep36RHqqctI/edit', 'title': source['violators'][0]['cells'][1]['formattedValue'], 'archived': True, 'status': source['violators'][1]['cells'][0]['formattedValue']},
        'veterans': {'url': 'https://docs.google.com/spreadsheets/d/17Ar9sZ7a7NIDpSQF7HZg6Iu1u7gjktS-SkpUU9OpmL0/edit', 'title': source['veterans'][0]['cells'][1]['formattedValue'], 'maintainer': source['veterans'][1]['cells'][0]['formattedValue']}
    }
}
target = root / 'dist' / 'department-data.js'
target.write_text('// Snapshot imported from supplied Google sources, 2026-10-03.\nObject.assign(window.MRP_DATA, ' + json.dumps(result, ensure_ascii=False, separators=(',', ':')) + ');\n')
print(json.dumps({k: len(result[k]) for k in ('instructions', 'violators', 'veterans')}, ensure_ascii=False))
