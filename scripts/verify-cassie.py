"""Verify the site against a complete native Google Docs connector response.

Usage: python3 scripts/verify-cassie.py /path/to/get_document.json [--stamp]
The optional stamp records provenance; it never rewrites command strings.
"""
import collections
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

snapshot = Path(sys.argv[1])
raw = json.loads(snapshot.read_text())
doc = raw.get('structuredContent', raw)
path = Path(__file__).resolve().parents[1] / 'dist/data.js'
data = json.loads(path.read_text().removeprefix('window.MRP_DATA = ').strip().removesuffix(';'))
assert doc['title'] == data['source']['title'], 'Different source document'
command_re = re.compile(r'^(?:cassieadvanced(?:\s|$)|cassie_sl\s|audio\s|otryadinfo\s|wave spawn\s|intercomtext\s|\$pitch_)', re.I)

def paragraphs(content):
    for element in content:
        if 'paragraph' in element:
            p = element['paragraph']
            text = ''.join(e.get('textRun', {}).get('content', '') or e.get('dropdown', {}).get('dropdownProperties', {}).get('displayValue', '') for e in p.get('elements', []))
            # Docs supplies a paragraph-ending newline and may prefix a soft break.
            if text.endswith('\n'):
                text = text[:-1]
            text = text.lstrip('\x0b')
            if text.strip():
                yield {'text': text, 'style': p.get('paragraphStyle', {}).get('namedStyleType', '')}
        if 'table' in element:
            for row in element['table']['tableRows']:
                for cell in row['tableCells']:
                    yield from paragraphs(cell.get('content', []))

tabs = doc['tabs']
assert len(tabs) == 28, 'Inspect changed document structure before verifying'
rows = []
for tab in tabs:
    rows.extend(dict(p, tab=tab['tabId'], tabTitle=tab['title']) for p in paragraphs((tab.get('body') or {}).get('content', [])))
commands = [p for r in data['records'] for p in r['parts'] if p['type'] == 'command']
live_commands = [r for r in rows if command_re.match(r['text'])]
assert collections.Counter(p['text'] for p in commands) == collections.Counter(p['text'] for p in live_commands), 'Command text or multiplicity differs'
notes = [p['text'] for r in data['records'] for p in r['parts'] if p['type'] == 'note']
assert not (collections.Counter(notes) - collections.Counter(r['text'] for r in rows)), 'Source note differs'
assert all(p in [r['text'] for r in rows] for p in data['usage']), 'Usage instructions differ'

words, in_words = [], False
for row in rows:
    if '【СЛОВАРЬ】' not in row['tabTitle']:
        continue
    text = row['text'].strip()
    if text == 'Слова и фразы':
        in_words = True
        continue
    if text == 'Эмодзи':
        in_words = False
    if in_words and row['style'] == 'NORMAL_TEXT' and not text.startswith(('┏', '┗')):
        words.append(text)
assert words == data['dictionary'], 'Dictionary text or order differs'

boxed = []
box = None
for row in rows:
    if row['text'].startswith('┏'):
        box = []
    elif row['text'].startswith('┗'):
        if box is not None:
            description = next((r['text'].split(':', 1)[1].strip() for r in box if r['text'].startswith('Описание:')), '')
            status = next((r['text'].split(':', 1)[1].strip() for r in box if r['text'].startswith('Статус:')), '')
            texts = [r['text'] for r in box if command_re.match(r['text'])]
            if description:
                candidates = [r for r in data['records'] if r['title'] == description and [p['text'] for p in r['parts'] if p['type'] == 'command'] == texts]
                assert candidates, f'Card title or command order differs: {description}'
                expected_status = next((k for k in data['legend'] if k in status), '')
                assert any(r['status'] == expected_status for r in candidates), f'Status differs: {description}'
                boxed.append(description)
        box = None
    elif box is not None:
        box.append(row)

report = {'documentTabs': len(tabs), 'records': len(data['records']), 'commandParts': len(commands),
          'notes': len(notes), 'dictionaryWords': len(words), 'namedCards': len(boxed),
          'exactCommandText': True, 'noteText': True, 'dictionaryTextAndOrder': True,
          'namedCardTitlesStatusesAndCommandOrder': True}
if '--stamp' in sys.argv:
    today = datetime.datetime.now(ZoneInfo('Asia/Vladivostok')).date().isoformat()
    url = doc.get('document_url') or doc['url']
    data['source'].update({'url': url, 'verifiedAt': today, 'kind': 'Сверено с Google Docs',
                          'verification': report, 'verificationSnapshotSha256': hashlib.sha256(snapshot.read_bytes()).hexdigest()})
    for record in data['records']:
        part = next((p for p in record['parts'] if p['type'] == 'command'), None)
        source_row = next((r for r in live_commands if part and r['text'] == part['text']), None)
        if not source_row:
            source_row = next((r for r in rows if any(p['type'] == 'note' and p['text'] == r['text'] for p in record['parts'])), None)
        if source_row:
            record['sourceUrl'] = url.split('?')[0] + '?tab=' + source_row['tab']
    data['archiveNotice'] = next(r['text'] for r in rows if r['text'].startswith('Данная вкладка содержит кастомные дорожки'))
    path.write_text('window.MRP_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(json.dumps(report, ensure_ascii=False))
