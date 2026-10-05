"""Import the supplied DOCX without rewriting executable command strings."""
import collections
import hashlib
import html
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / 'dist' / 'data.js'
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(source) as z:
    root = ET.fromstring(z.read('word/document.xml'))
rows = []
for p in root.findall('.//w:body//w:p', ns):
    value = ''.join(n.text or '' for n in p.findall('.//w:t', ns))
    if value.strip():
        style = p.find('w:pPr/w:pStyle', ns)
        rows.append({'text': value, 'style': style.get('{'+ns['w']+'}val') if style is not None else ''})

categories = {
    'ГРУППИРОВКИ': ('groups', 'Группировки', 'Группировки'),
    'МОГ': ('mtf', 'Мобильные группы', 'Группировки'),
    'ПХ': ('chaos', 'Повстанцы Хаоса', 'Группировки'),
    'О.НОУС': ('general-breach', 'Общий НОУС', 'SCP-объекты'),
    'НОУС': ('breach', 'Нарушение содержания', 'SCP-объекты'),
    'ВОУС': ('contained', 'Восстановление условий', 'SCP-объекты'),
    'ПОБЕГ': ('escape', 'Побег объектов', 'SCP-объекты'),
    'ИНСТРУКЦИИ': ('instructions', 'Инструкции', 'SCP-объекты'),
    'АГРЕССИЯ': ('aggression', 'Агрессия объектов', 'SCP-объекты'),
    'ЗАПРОСЫ': ('requests', 'Запросы', 'Персонал'),
    'ПРЕДЫ': ('warnings', 'Предупреждения', 'Персонал'),
    'ПРИКАЗЫ': ('orders', 'Приказы', 'Персонал'),
    'НАПОМИНАНИЯ': ('reminders', 'Напоминания', 'Персонал'),
    'ИНТЕРКОМ': ('intercom', 'Интерком', 'Комплекс'),
    'НЕПОЛАДКИ': ('failures', 'Неполадки', 'Комплекс'),
    'ПРОТОКОЛЫ': ('protocols', 'Протоколы', 'Комплекс'),
    'СКАНИРОВАНИЕ': ('scanning', 'Сканирование', 'Комплекс'),
    'МЕСТОПОЛОЖЕНИЕ': ('location', 'Местоположение', 'Комплекс'),
    'ГЕНЕРАТОРЫ': ('generators', 'Генераторы', 'Комплекс'),
    'АРХИВ': ('archive', 'Архив', 'Дополнительно'),
    'ЧЕРНОВИКИ': ('drafts', 'Черновики', 'Дополнительно'),
}
legend = {
    '🟩': {'label': 'Готова', 'tone': 'green'},
    '🟢': {'label': 'Ожидает замены', 'tone': 'amber'},
    '🟧': {'label': 'Есть недочёты', 'tone': 'amber'},
    '🟨': {'label': 'Без оформления в документе', 'tone': 'amber'},
    '🟡': {'label': 'Без оформления в игре', 'tone': 'amber'},
    '🟥': {'label': 'Требует правок', 'tone': 'red'},
    '🟦': {'label': 'В разработке', 'tone': 'blue'},
    '🟪': {'label': 'Не протестирована', 'tone': 'purple'},
    '⚪': {'label': 'Заменена', 'tone': 'muted'},
}
command_re = re.compile(r'^(?:cassieadvanced(?:\s|$)|cassie_sl\s|audio\s|otryadinfo\s|wave spawn\s|intercomtext\s|\$pitch_)', re.I)

def display_text(command):
    """Read subtitles without inserting spaces into words split by colour tags."""
    if not re.match(r'^(?:cassieadvanced|cassie_sl|intercomtext)\s', command, re.I):
        return ''
    text = re.split(r'\$pitch_|\bpitch_', command, maxsplit=1, flags=re.I)[0]
    text = re.sub(r'^(?:cassieadvanced\s+custom\s+\w+\s+\d+|cassie_sl|intercomtext)\s*', '', text, flags=re.I)
    visible, hidden = [], False
    for token in re.split(r'(<[^>]*>)', text):
        size = re.fullmatch(r'<size=([^>]+)>', token, re.I)
        if size:
            hidden = size[1].strip() in ('0', '0%', '0px')
        elif token.lower() == '</size>':
            hidden = False
        elif token.startswith('<'):
            if not hidden and re.fullmatch(r'<(?:br\s*/?|split)>', token, re.I):
                visible.append(' ')
        elif not hidden:
            visible.append(token)
    text = re.sub(r'\s+', ' ', html.unescape(''.join(visible))).strip()
    return text if re.search('[А-Яа-яЁё]', text) else ''

records = []
category = ''
subhead = ''
detail = ''
box = None
previous = ''

def make_record(lines, first_index, title_fallback=None):
    if category not in categories:
        return
    raw_status = next((r['text'].split(':',1)[1].strip() for _,r in lines if r['text'].startswith('Статус:')), '')
    title = next((r['text'].split(':',1)[1].strip() for _,r in lines if r['text'].startswith('Описание:')), '')
    title = title or title_fallback or ' · '.join(filter(None,[subhead,detail])) or categories[category][1]
    parts = []
    for idx, r in lines:
        value = r['text']
        if value.startswith(('Статус:', 'Описание:')) or value.strip() in ('-', 'АРХИВ'):
            continue
        if command_re.match(value):
            parts.append({'type': 'command', 'text': value, 'displayText': display_text(value), 'sourceParagraph': idx,
                          'complete': bool(re.search(r'\s\S', value))})
        else:
            parts.append({'type': 'note', 'text': value})
    if not parts and not title:
        return
    cat_id, cat_name, group = categories[category]
    shelf = 'archive' if category == 'АРХИВ' else 'drafts' if category == 'ЧЕРНОВИКИ' else 'catalog'
    commands = [p for p in parts if p['type']=='command']
    preview = next((cmd['displayText'] for cmd in commands if cmd['displayText']), '')
    status = next((key for key in legend if key in raw_status), '')
    duration = re.search(r'(?i)^cassieadvanced custom \w+ (\d+)', commands[0]['text']) if commands else None
    record = {'id': f'cassie-{first_index:04}', 'title': title, 'category': cat_id, 'categoryLabel': cat_name,
              'group': group, 'subcategory': ' · '.join(filter(None,[subhead,detail])),
              'shelf': shelf, 'status':status, 'parts': parts, 'preview': preview,
              'duration': int(duration[1]) if duration else None,
              'sourceParagraph':first_index}
    records.append(record)

for i,r in enumerate(rows):
    t=r['text']
    if r['style']=='Title':
        category = re.sub(r'^.*【|】.*$', '', t)
        subhead = detail = ''
        if category=='СЛОВАРЬ': break
    elif r['style']=='Heading1':
        subhead=t; detail=''
    elif r['style']=='Heading2':
        detail=t
    if t.startswith('┏'):
        box=[]; box_start=i
    elif t.startswith('┗'):
        if box is not None:
            make_record(box,box_start)
        box=None
    elif box is not None:
        box.append((i,r))
    elif category in ('АРХИВ','ЧЕРНОВИКИ') and command_re.match(t):
        extra=[]
        if previous.startswith('Причина использования:'):
            extra=[(i-1,rows[i-1])]
        title=None
        if category=='ЧЕРНОВИКИ':
            if previous.isdigit():title=f'Побег SCP-{previous} · черновик'
            elif t.startswith('intercomtext '):title=f'Текст интеркома · вариант {sum(x["title"].startswith("Текст интеркома") for x in records)+1}'
            elif subhead=='МЕРТВЫЕ ОПОВЕЩЕНИЯ':title=f'Мёртвые оповещения · вариант {sum(x["title"].startswith("Мёртвые оповещения") for x in records)+1}'
        make_record(extra+[(i,r)],i,title)
    previous=t

# Preserve unstructured explanatory draft separately; never turn prose into a command.
draft_intro=next((i for i,r in enumerate(rows) if r['text']=='Текст для CASSIE на взлом гермоворот ПХшниками'),None)
if draft_intro is not None:
    records.append({'id':'cassie-draft-gates','title':'Взлом гермоворот ПХ · текст оповещения',
    'category':'drafts','categoryLabel':'Черновики','group':'Дополнительно','subcategory':'Интерком',
    'shelf':'drafts','status':'','parts':[{'type':'note','text':rows[draft_intro+1]['text']}],
    'preview':'','duration':None,'sourceParagraph':draft_intro})

words=[]
in_dictionary=False
for r in rows:
    t=r['text'].strip()
    if r['style']=='Heading1' and t=='Слова и фразы':in_dictionary=True; continue
    if r['style']=='Heading1' and t=='Эмодзи':in_dictionary=False
    if in_dictionary and not r['style'] and not t.startswith(('┏','┗')):words.append(t)
words=list(dict.fromkeys(words))

command_parts=[part for record in records for part in record['parts'] if part['type']=='command']
for part in command_parts:
    assert part['text']==rows[part['sourceParagraph']]['text'], 'Command text must remain exact'
all_source_commands={i for i,r in enumerate(rows) if 116<=i<1330 and command_re.match(r['text'])}
included={p['sourceParagraph'] for p in command_parts}
assert included==all_source_commands, f'Missing commands: {all_source_commands-included}'
assert len({x['id'] for x in records})==len(records)
data={'version':'1.0.0','source':{'title':'MANDARIN MRP | SCP:SL CASSIE | official doc | tramvay52 | Private',
       'author':'tramvay52','helper':'Myagor','importedAt':'2026-10-02','kind':'Вложенная копия документа',
       'sha256':hashlib.sha256(source.read_bytes()).hexdigest()},
      'categories':[{'id':v[0],'label':v[1],'group':v[2]} for v in categories.values()],
      'legend':legend,'records':records,'dictionary':words,
      'usage':[rows[59]['text'],rows[60]['text']],
      'instructions':[],'leadership':[],'violators':[],'veterans':[]}
target.write_text('window.MRP_DATA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'records':len(records),'shelves':dict(collections.Counter(x['shelf'] for x in records)),
                  'commandParts':len(command_parts),'dictionaryWords':len(words),'exactCommandsVerified':True},ensure_ascii=False))
