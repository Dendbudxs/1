(() => {
  'use strict';
  const base = window.KB;
  const departments = {
    mrp: { label: 'Medium RP', short: 'MRP', globalCooldown: '42 часа', miniCooldown: '2 часа 30 минут', globalHours: '42', miniHours: '2:30' },
    nr: { label: 'NoRules', short: 'NR', globalCooldown: '3 часа', miniCooldown: '2 часа', globalHours: '3', miniHours: '2' },
    classic: { label: 'Classic', short: 'CLASSIC', globalCooldown: '3 часа', miniCooldown: '2 часа', globalHours: '3', miniHours: '2' }
  };
  const ranks = { trainee: 'Стажёр', junior: 'Мл. ивент-мастер', master: 'Ивент-мастер', senior: 'Ст. ивент-мастер', lead: 'Руководство' };
  const rankLevel = { trainee: 0, junior: 1, master: 2, senior: 3, lead: 4 };
  const datasets = { mrp: { ...base, events: base.events.map(v=>({...v,type:'mini'})), globals: base.globals.map(v=>({...v,type:'global',rank:'senior'})) } };
  for (const key of ['nr', 'classic']) {
    const guide = JSON.parse(JSON.stringify(base.guides.filter(g=>g.id!=='cassie-guide')));
    const get = id => guide.find(g=>g.id===id);
    get('voting').sections[2].paragraphs = ['После отрицательного результата повторное голосование допускается через 20 минут. Для проведения нужно строго больше 50% голосов.'];
    get('cooldowns').summary = '3 часа между ивентами, 2 часа для мини-ивентов.';
    get('cooldowns').sections[0] = {title:'Интервалы '+departments[key].label,table:[['Событие','Интервал'],['Ивент','3 часа'],['Мини-ивент','2 часа'],['Повторное голосование после «нет»','20 минут']]};
    get('cooldowns').sections[1].paragraphs = ['Откат проверяют до следующего проведения. Интервалы на этой странице относятся к '+departments[key].label+'.'];
    get('ranks').sections[0].table = [['Должность','Самостоятельное проведение'],['Младший ивент-мастер','Мини-ивенты с зелёными названиями в исходнике'],['Ивент-мастер','Мини-ивенты и глобальные сценарии с оранжевыми названиями'],['Старший ивент-мастер','Остальные глобальные ивенты, кроме сценариев руководства'],['Руководство','Включая сценарии с отдельной отметкой допуска']];
    get('ranks').sections[2] = {title:'Стажировка',paragraphs:[key==='nr'?'Стажировка NR длится неделю: изучение регламента и не менее пяти отзывов.':'В общем руководстве нет отдельного срока стажировки Classic. Уточни порядок у руководства своего сервера.']};
    get('announce').sections[1].table[2] = ['Бот сервера','Discord ID бота '+departments[key].label+' — уточни в evnt-команды'];
    const cards = window.DEPARTMENT_EVENTS[key];
    const eventSource = base.sources.events.replace('t.rdsra8mf7pg8',key==='nr'?'t.0':'t.418r9abcsxd1');
    guide.push({id:'rewards',title:'Награды за ивенты',icon:'check',summary:'Пределы наград, если они предусмотрены сценарием.',source:'events',sections:[{title:'Условия',paragraphs:['Награда выдаётся только там, где она предусмотрена сценарием. Просьба победителя должна укладываться в ограничения.'],table:[['Настройка','Предел из источника'],['SET HP','400'],['SET MAX','150'],['Масштаб','0.8–1.2']]},{title:'Ограничения',list:['Нельзя выдавать GodMode, Noclip, Bypass, менять работу сервера или затрагивать всех игроков одновременно.','Наградой не может быть роль SCP, «Обучение» или MicroHID.','В источнике отдельно заданы SET HP 400 и SET MAX 150. Если их совместное применение вызывает вопрос, уточни его до выдачи награды.']}]});
    datasets[key] = {...base,guides:guide,sources:{guide:base.sources.guide,events:eventSource},events:cards.filter(v=>v.type==='mini'),globals:cards.filter(v=>v.type==='global'),cassie:[],commands:base.commands.filter(c=>!['color','resetcolor'].includes(c.id)).map(c=>c.id==='announce'?{...c,code:'!create_announce "<название>" <DiscordID бота сервера> <тип> <DiscordID проводящих>'}:c)};
  }
  let department = 'mrp', D = datasets.mrp;
  const url = path => '#'+department+'/'+path;
  const scopeLinks = html => html.replace(/href="#(?!departments|mrp\/|nr\/|classic\/)([^\"]+)"/g,(_,path)=>'href="'+url(path)+'"');
  const $ = s => document.querySelector(s);
  const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths = {
    grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    book:'M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1z M12 5v15',
    layers:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',
    radio:'M12 8v8 M8 6a9 9 0 0 0 0 12 M16 6a9 9 0 0 1 0 12 M4 3a14 14 0 0 0 0 18 M20 3a14 14 0 0 1 0 18',
    terminal:'M3 4h18v16H3z m4 5 3 3-3 3 M13 16h4',
    external:'M14 3h7v7 M21 3l-11 11 M10 3H3v18h18v-7',
    search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    arrow:'M4 12h16 m-6-6 6 6-6 6',
    back:'M20 12H4 m6-6-6 6 6 6',
    menu:'M4 6h16 M4 12h16 M4 18h16',
    check:'M9 11l3 3 8-9 M20 12v8H4V4h10',
    info:'M12 10v6 M12 7v.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z M8 12l3 3 5-6',
    clock:'M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    vote:'m7 9 5 4 5-4 M7 3h10v9H7z M4 12l-2 5v4h20v-4l-2-5 M2 17h20',
    users:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 3a4 4 0 0 1 0 8 M22 21v-3a4 4 0 0 0-3-4',
    copy:'M9 9h12v12H9z M5 15H3V3h12v2'
  };
  function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.book}"/></svg>`; }
  document.querySelectorAll('[data-icon]').forEach(n => n.innerHTML = icon(n.dataset.icon));
  const ext = (url,label='Открыть исходник') => `<a class="source-link" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)}${icon('external')}</a>`;
  const note = text => `<div class="note">${icon('info')}<p>${e(text)}</p></div>`;
  const tag = (text,style='') => `<span class="tag ${style}">${e(text)}</span>`;
  const rankLabel = r => ({junior:'От мл. ивент-мастера',master:'От ивент-мастера',senior:'От ст. ивент-мастера',lead:'Только руководство'}[r] || 'Допуск уточняется');
  const count = (n,one,few,many) => n+' '+(n%100>=11&&n%100<=14 ? many : n%10===1 ? one : n%10>=2&&n%10<=4 ? few : many);
  let codeRegistry = [], toastTimeout, searchTimer;
  function code(text,label='REMOTE ADMIN · ШАБЛОН') {
    const id=codeRegistry.push(text)-1;
    return `<div class="code-panel"><div class="code-head"><span>${e(label)}</span><button class="copy-button" data-copy="${id}" aria-label="Копировать команду">${icon('copy')}<span>Копировать</span></button></div><pre><code>${e(text)}</code></pre></div>`;
  }
  function table(rows) { return `<div class="table-scroll"><table><thead><tr>${rows[0].map(c=>`<th scope="col">${e(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(c=>`<td>${e(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
  function technical(rows) { return `<dl class="technical">${rows.map(([k,v])=>`<div class="technical-row"><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl>`; }
  function section(s,index) {
    const list=s.ordered?'ol':'ul';
    return `<section><h2 id="section-${index}">${e(s.title)}</h2>${(s.paragraphs||[]).map(p=>`<p>${e(p)}</p>`).join('')}${s.list?`<${list}>${s.list.map(p=>`<li>${e(p)}</li>`).join('')}</${list}>`:''}${s.table?table(s.table):''}${(s.commands||[]).map(c=>code(c)).join('')}</section>`;
  }
  function pageIntro(title,lead,eyebrow='МАНДАРИНОВЫЙ КОМПЛЕКС / БАЗА ЗНАНИЙ') {
    $('.page-intro').innerHTML=`<div class="eyebrow">${e(eyebrow)}</div><h1>${e(title)}<span class="orange">.</span></h1>${lead?`<p class="lead">${e(lead)}</p>`:''}`;
  }
  function departmentEntry() {
    const nrCount=datasets.nr.events.length+datasets.nr.globals.length;
    return '<div class="department-entry"><div class="department-options">'+[
      ['mrp','01','Medium RP','Истории комплекса, RP-сценарии и объявления C.A.S.S.I.E.','21 мини-ивент · 30 ивентов','MRP'],
      ['nr','02','NoRules / Classic','Мини-ивенты, игровые режимы и правила двух серверов.',nrCount+' карточек NR · '+(datasets.classic.events.length+datasets.classic.globals.length)+' Classic','NR + CLASSIC']
    ].map(([key,n,title,desc,meta,badge])=>'<a class="department-card" href="#'+key+'/home"><div class="department-card-top"><span class="department-card-id"><img class="department-citrus" src="assets/mandarin-snow-brand.png" width="1254" height="1254" alt=""><span class="directory-number">'+n+'</span></span><span class="tag '+(key==='mrp'?'orange':'green')+'">'+badge+'</span></div><h2>'+title+'</h2><p>'+desc+'</p><div class="department-card-bottom"><span>'+meta+'</span><span class="department-enter">Открыть отдел '+icon('arrow')+'</span></div></a>').join('')+
    '</div><figure class="containment-art"><img src="assets/mandarins-containment.png" width="1536" height="1024" alt="Мандарины в лабораторном контейнере, покрытом инеем"><figcaption><span>МАНДАРИНОВЫЙ КОМПЛЕКС</span></figcaption><div class="art-label" aria-hidden="true">ОБЪЕКТ: МАНДАРИН<br>УСЛОВИЯ: УЮТНЫЕ</div></figure></div><p class="entry-hint">'+icon('info')+'Отдел всегда можно сменить в шапке. В NoRules / Classic появится отдельный выбор сервера.</p>';
  }
  function home() {
    const config=departments[department];
    const cards=[
      ['guide','Руководство','Регламент, допуски и порядок проведения.',D.guides.filter(g=>g.id!=='cassie-guide').length+' разделов'],
      ['events','Ивент-лист','Сценарии '+config.label+' с выбором по должности.',D.events.length+' мини-ивентов · '+D.globals.length+' ивентов'],
      department==='mrp'?['cassie','C.A.S.S.I.E.','Объявления, протоколы и словарь команд.','20 тематических групп']:['commands','Команды','Голосования, роли и анонсы мероприятий.',D.commands.length+' команд']
    ];
    return '<div class="home-layout"><section class="directory-section"><div class="section-heading"><h2>Разделы справочника</h2><span>01 — 03</span></div><div class="directory">'+cards.map(([id,t,s,n],i)=>'<a class="directory-card" href="#'+id+'"><span class="directory-number">0'+(i+1)+'</span><div class="directory-copy"><span class="directory-meta">'+e(n)+'</span><h2>'+e(t)+'</h2><p>'+e(s)+'</p></div><span class="directory-arrow">'+icon('arrow')+'</span></a>').join('')+'</div></section>'+
    '<section class="start-panel"><div class="panel-art" aria-hidden="true"><img src="assets/mandarins-containment.png" width="1536" height="1024" alt=""><span>АРХИВ / '+config.short+'</span></div><div class="section-heading"><h2>Перед стартом</h2><span class="status-label">'+config.short+'</span></div><div class="facts">'+[
      ['voting','Голосов за проведение','&gt;50','%'],
      ['preparation','Онлайн: ивент / мини','15 <small>/</small> 10','чел.'],
      ['cooldowns','Откат ивента',config.globalHours,'ч.'],
      ['cooldowns','Откат мини-ивента',config.miniHours,'ч.']
    ].map(([id,label,value,unit])=>'<a href="#guide/'+id+'" class="fact"><span class="fact-label">'+label+'</span><span class="fact-value">'+value+'<small>'+unit+'</small></span></a>').join('')+'</div><p class="source-notice">После отрицательного голосования повторить его можно через 20 минут.</p><a class="source-link" href="#guide/preparation">Порядок подготовки '+icon('arrow')+'</a></section></div>'+
    '<section class="quick-panel"><div class="section-heading"><h2>Под рукой</h2><a class="link-arrow" href="#guide">Все разделы '+icon('arrow')+'</a></div><div class="quick-list">'+[
      ['events?role=junior','Для младших','Доступные сценарии'],['guide/voting','Голосование','Порядок и команды'],['commands','Команды','Роли, отряды, анонсы'],['guide/ranks','Допуски','Должности и ограничения']
    ].map(([id,t,s],i)=>'<a class="quick-row" href="#'+id+'"><span class="quick-index">0'+(i+1)+'</span><span><span class="quick-title">'+t+'</span><small>'+s+'</small></span>'+icon('arrow')+'</a>').join('')+'</div></section>'+note('Изменения сценария согласовываются с руководством. Правила сервера продолжают действовать во время любого ивента.');
  }
  function guideIndex() { return `<div class="guide-grid">${D.guides.filter(g=>g.id!=='cassie-guide').map(g=>`<a class="guide-card" href="#guide/${g.id}">${icon(g.icon)}<div><h2>${e(g.title)}</h2><p>${e(g.summary)}</p></div></a>`).join('')}</div>`; }
  function guideDetail(id) {
    const g=D.guides.find(g=>g.id===id);if(!g)return notFound();
    pageIntro(g.title,g.summary,'ИВЕНТ-ОТДЕЛ / РУКОВОДСТВО');
    return `<div class="article-heading"><a class="back-link" href="#${g.source==='cassie'?'cassie':'guide'}">${icon('back')}К разделу</a>${tag(g.source==='cassie'?'C.A.S.S.I.E.':'Регламент '+departments[department].label)}</div><div class="article-layout"><article class="article">${g.sections.map(section).join('')}</article><aside class="article-aside"><h3>НА ЭТОЙ СТРАНИЦЕ</h3>${g.sections.map((s,i)=>`<a href="#" data-jump="section-${i}">${e(s.title)}</a>`).join('')}<div class="aside-source">${ext(D.sources[g.source||'guide'])}</div></aside></div><div class="source-date">По документам от ${D.updated} · ${ext(D.sources[g.source||'guide'],'Полный текст')}</div>`;
  }
  const filterLinks = (list,current) => `<div class="filters">${list.map(([id,label,url])=>`<a class="filter ${id===current?'active':''}" href="${e(url)}" ${id===current?'aria-current="page"':''}>${e(label)}</a>`).join('')}</div>`;
  function eventCard(v) {
    return '<a href="#events/'+v.id+'" class="event-card '+(v.disabled?'event-unavailable':'')+'"><div class="item-code">'+(v.type==='global'?'ГЛОБАЛЬНЫЙ ИВЕНТ':e(v.code))+'</div><h2>'+e(v.title)+'</h2><p>'+e(v.summary)+'</p><div class="tag-row">'+tag(rankLabel(v.rank),v.rank==='junior'?'green':v.rank==='lead'?'orange':'gray')+(v.disabled?tag('Временно недоступен','orange'):'')+(v.referenceOnly?tag('Справочная запись'):'')+'</div><div class="card-footer"><span>'+(v.disabled?'Посмотреть статус':v.referenceOnly?'Сведения о сценарии':v.tech?'Открыть карточку':'Документ сценария')+'</span>'+icon('arrow')+'</div></a>';
  }
  function eventIndex(params) {
    const oldJunior=params.get('type')==='junior';
    const role=oldJunior?'junior':Object.hasOwn(ranks,params.get('role'))?params.get('role'):'all';
    const type=['mini','global'].includes(params.get('type'))?params.get('type'):'all';
    const activeOnly=role!=='all';
    const all=[...D.events,...D.globals];
    const allowed=all.filter(v=>!activeOnly||(!v.disabled&&!v.referenceOnly&&rankLevel[v.rank]<=rankLevel[role]));
    const items=allowed.filter(v=>type==='all'||v.type===type);
    const link=(newType,newRole)=>'#events?type='+newType+'&role='+newRole;
    const roleTabs=[['all','Все должности'],...Object.entries(ranks)];
    return '<section class="role-picker" aria-labelledby="role-title"><div class="role-heading"><span class="role-symbol">'+icon('shield')+'</span><div><h2 id="role-title">Моя должность</h2><p>Выбери роль, чтобы увидеть доступные тебе ивенты.</p></div><a href="#guide/ranks" class="source-link">Как устроен допуск '+icon('arrow')+'</a></div><nav class="role-options" aria-label="Фильтр по должности">'+roleTabs.map(([id,label])=>'<a href="'+link(type,id)+'" class="role-option '+(role===id?'active':'')+'" '+(role===id?'aria-current="true"':'')+'>'+e(label)+(role===id?icon('check'):'')+'</a>').join('')+'</nav><p class="role-explanation">'+(activeOnly?'Показаны действующие сценарии для самостоятельного проведения. Проведение под присмотром согласовывается отдельно.':'Весь каталог отдела, включая временно недоступные и справочные карточки.')+'</p></section>'+
    '<div class="toolbar">'+filterLinks([['all','Все · '+allowed.length,link('all',role)],['mini','Мини-ивенты · '+allowed.filter(v=>v.type==='mini').length,link('mini',role)],['global','Глобальные · '+allowed.filter(v=>v.type==='global').length,link('global',role)]],type)+'<span class="count-label">'+count(items.length,'сценарий','сценария','сценариев')+'</span></div>'+
    (items.length?'<div class="event-grid">'+items.map(eventCard).join('')+'</div>':'<div class="empty">'+icon('book')+'<h2>'+(role==='trainee'?'Сначала — стажировка':'Здесь пока нет доступных сценариев')+'</h2><p>'+(role==='trainee'?'Самостоятельный допуск в документах начинается с младшего ивент-мастера. Начни с руководства и участия в подготовке.':'Попробуй другой тип события или открой весь каталог.')+'</p><a class="text-button" href="'+(role==='trainee'?'#guide/ranks':'#events')+'">'+(role==='trainee'?'Порядок стажировки':'Весь каталог')+'</a></div>');
  }
  function eventDetail(id) {
    const v=[...D.events,...D.globals].find(v=>v.id===id);if(!v)return notFound();
    const isGlobal=v.type==='global', config=departments[department];
    pageIntro(v.title,(isGlobal?'Глобальный ивент':'Мини-ивент')+' · '+config.label,'МАНДАРИНОВЫЙ КОМПЛЕКС / ИВЕНТ-ЛИСТ');
    const heading='<div class="article-heading"><a class="back-link" href="#events?type='+(isGlobal?'global':'mini')+'">'+icon('back')+'К каталогу</a><div class="tag-row">'+tag(rankLabel(v.rank),v.rank==='junior'?'green':'orange')+(v.disabled?tag('Временно недоступен','orange'):'')+'</div></div>';
    const conditions=technical([['Должность',rankLabel(v.rank)],['Онлайн',isGlobal?'От 15 игроков':'От 10 игроков'],['Голосование','Больше 50% за проведение'],['Откат',isGlobal?config.globalCooldown:config.miniCooldown]]);
    if(v.referenceOnly)return heading+'<article class="article"><p class="detail-summary">'+e(v.summary)+'</p>'+note(v.disabled?'В каталоге NR сценарий отмечен как временно недоступный.':'В этой карточке сохранено только название сценария. План проведения на сайте не размещён.')+'</article>';
    if(isGlobal&&!v.tech)return heading+'<article class="article"><p class="detail-summary">'+e(v.summary)+'</p>'+(v.author?'<p>Автор: '+e(v.author)+'</p>':'')+'<div class="source-card"><h2>Сценарий «'+e(v.title)+'»</h2><p>Отдельный документ с ролями, этапами и техническим планом.</p>'+ext(v.source,'Открыть сценарий')+'</div><h2>Условия проведения</h2>'+conditions+'<a class="source-link" href="#guide/preparation">Подготовка к проведению '+icon('arrow')+'</a></article>';
    return heading+(v.disabled?note('В исходнике '+config.label+' этот сценарий временно недоступен. Карточка сохранена для справки. Не проводи его до снятия ограничения.'):'')+'<div class="article-layout"><article class="article"><p class="detail-summary">'+e(v.summary)+'</p><h2 id="tech">Технический план</h2>'+technical(v.tech)+(v.notice?note(v.notice):'')+(v.codes||[]).map(c=>code(c)).join('')+'<h2 id="rules">Порядок и ограничения</h2><ul>'+v.rules.map(r=>'<li>'+e(r)+'</li>').join('')+'</ul><h2 id="conditions">Условия проведения</h2>'+conditions+(v.cassie?'<h2 id="announcements">Объявления C.A.S.S.I.E.</h2><a class="guide-card" href="#cassie/'+v.cassie+'">'+icon('radio')+'<div><h2>Объявления для сценария</h2><p>Оповещения и ссылка на вкладку.</p></div></a>':'')+'<div class="source-date">Краткая карточка по ивент-листу · '+ext(v.source||D.sources.events,'Полный сценарий в источнике')+'</div></article><aside class="article-aside"><h3>НА ЭТОЙ СТРАНИЦЕ</h3><a href="#" data-jump="tech">Технический план</a><a href="#" data-jump="rules">Порядок и ограничения</a><a href="#" data-jump="conditions">Условия проведения</a><div class="aside-source"><h3>'+config.short+'</h3><p>'+rankLabel(v.rank)+'</p>'+ext(v.source||D.sources.events)+'</div></aside></div>';
  }
  function cassieIndex(params) {
    const cat=params.get('category')||'all';
    const category=v=>['mog','chaos'].includes(v.id)?'groups':['sar-7','shift','protocols'].includes(v.id)?'systems':'scp';
    const items=D.cassie.filter(v=>cat==='all'||cat===category(v));
    return `<div class="article-heading"><a class="source-link" href="#guide/cassie-guide">${icon('book')}Как составить объявление</a>${tag('76 заполненных объявлений')}</div><div class="toolbar">${filterLinks([['all','Все','#cassie'],['scp','SCP-объекты','#cassie?category=scp'],['groups','Отряды','#cassie?category=groups'],['systems','Системы и протоколы','#cassie?category=systems']],cat)}</div><p class="list-intro">Выбери объект или протокол. Здесь — назначение объявлений; точные дорожки с таймингом открываются в исходном документе.</p><div class="event-grid">${items.map(v=>`<a class="event-card" href="#cassie/${v.id}"><div class="item-code">C.A.S.S.I.E. / ${category(v)==='scp'?'ОБЪЕКТ':'СИСТЕМА'}</div><h2>${e(v.title)}</h2><p>${e(v.summary)}</p><div class="card-footer"><span>${count(v.items.filter(i=>i.available).length,'объявление','объявления','объявлений')}</span>${icon('arrow')}</div></a>`).join('')}</div>`;
  }
  function cassieDetail(id) {
    const g=D.cassie.find(g=>g.id===id);if(!g)return notFound();
    pageIntro(g.title,g.summary,'ИВЕНТ-ОТДЕЛ / C.A.S.S.I.E.');
    return `<div class="article-heading"><a class="back-link" href="#cassie">${icon('back')}Все объявления</a>${ext(g.source,'Открыть вкладку с командами')}</div><p class="list-intro">НОУС — нарушение особых условий содержания. ВОУС — восстановление особых условий содержания.</p><div class="announcements">${g.items.map((v,i)=>`<article class="announcement" id="announcement-${i}"><span class="announcement-icon">${icon('radio')}</span><div><h2>${e(v.title)}</h2><p>${e(v.summary)}</p>${v.available?ext(g.source,'Команда в документе'):''}</div>${tag(v.available?'В источнике':'Не заполнено',v.available?'':'orange')}</article>`).join('')}</div><div class="source-date">${ext(D.sources.cassie,'Руководство по C.A.S.S.I.E.')}</div>`;
  }
  function commandsIndex(params,id) {
    const groups=['Все',...new Set(D.commands.map(c=>c.group))];
    const selected=params.get('group')||'Все';
    const items=D.commands.filter(c=>id?c.id===id:selected==='Все'||c.group===selected);
    if(id && !items.length)return notFound();
    return `${id?'<a class="back-link" href="#commands">'+icon('back')+'Все команды</a>':`<div class="toolbar">${filterLinks(groups.map(g=>[g,g,'#commands'+(g==='Все'?'':'?group='+encodeURIComponent(g))]),selected)}</div>`}<p class="list-intro">Перед вводом замени заполнители в угловых скобках. Команды Remote Admin выполняются в игре, а анонс — в канале evnt-команды.</p><div class="article">${items.map(c=>`<section id="command-${c.id}"><h2>${e(c.title)}</h2><p>${e(c.desc)}</p>${code(c.code,c.group==='Анонсы'?'DISCORD · EVNT-КОМАНДЫ':c.code.startsWith('.')?'ИГРОВАЯ КОНСОЛЬ':'REMOTE ADMIN')}</section>`).join('')}</div>`;
  }
  function sources() {
    const config=departments[department];
    const list=[['guide','Руководство ивент-мастеров','Общий регламент, голосование, стажировка, откаты и административные команды.'],['events','Ивент-лист · '+config.label,'Выбрана вкладка '+config.label+'. На сайте представлены краткие карточки '+D.events.length+' мини-ивентов и '+D.globals.length+' глобальных сценариев. Должности учитывают цвет заголовков в документе.']];
    if(department==='mrp')list.push(['cassie','C.A.S.S.I.E. для MRP','Синтаксис и каталог 76 заполненных объявлений. Незавершённые записи отмечены отдельно.']);
    return '<p class="list-intro">Справочник содержит конспекты документов. Полные авторские тексты и готовые объявления остаются в оригиналах.</p>'+list.map(([k,t,s])=>'<article class="source-card"><h2>'+e(t)+'</h2><p>'+e(s)+'</p>'+ext(D.sources[k],'Открыть Google Документ')+'</article>').join('')+'<div class="article"><h2>Актуальность</h2><p>Материалы сверены '+D.updated+'. Сайт не обновляется автоматически вслед за Google Документами. При расхождениях сверься с оригиналом и руководством отдела.</p><p>Доступ к оригиналам определяется настройками их владельцев. Справочник открывается без входа.</p>'+(department!=='mrp'?'<p>Две позиции исходного каталога не перенесены; одна представлена только справочной записью без плана. Такие записи не входят в подборку доступных по должности сценариев.</p>':'')+'<h2>Авторство</h2><p>Исходные материалы: Mandarin, 2025–2026. Авторы руководства: Советник, Пивной Анчоус, Lafayette; редактор: Henry.Morgan. Авторы отдельных сценариев указаны в карточках. Названия SCP используются в контексте игровых сценариев проекта.</p></div>';
  }
  const searchable=()=>[
    ...D.guides.map(g=>({title:g.title,summary:g.summary,body:JSON.stringify(g.sections),section:'Руководство',url:'#guide/'+g.id})),
    ...D.events.map(v=>({title:v.code+' · '+v.title,summary:v.summary+(v.disabled?' Временно недоступен.':''),body:JSON.stringify([v.tech,v.rules,v.codes]),section:'Мини-ивенты',url:'#events/'+v.id})),
    ...D.globals.map(v=>({title:v.title,summary:v.author?'Автор: '+v.author:v.summary,body:JSON.stringify([v.tech,v.rules,v.author]),section:'Глобальные ивенты',url:'#events/'+v.id})),
    ...D.commands.map(c=>({title:c.title,summary:c.code,body:c.desc+' '+c.group,section:'Команды',url:'#commands/'+c.id})),
    ...D.cassie.flatMap(g=>g.items.map((v,i)=>({title:g.title+' · '+v.title,summary:v.summary,body:g.summary,section:'C.A.S.S.I.E.',url:'#cassie/'+g.id+'?item='+i})))
  ];
  const normalize=s=>s.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  function searchResults(q) {
    const words=normalize(q).split(/\s+/).filter(Boolean);
    if(!words.length)return `<div class="empty">${icon('search')}<h2>Что будем искать?</h2><p>Введи название объекта, правило или команду.</p></div>`;
    const hits=searchable().map(v=>({...v,score:words.reduce((n,w)=>n+(normalize(v.title).includes(w)?4:0)+(normalize(v.summary).includes(w)?2:0),0)})).filter(v=>words.every(w=>normalize(v.title+' '+v.summary+' '+v.body).includes(w))).sort((a,b)=>b.score-a.score);
    return `<div class="section-heading"><h2>Результаты поиска</h2><span>${count(hits.length,'совпадение','совпадения','совпадений')}</span></div>${hits.length?hits.map(v=>`<a class="search-result" href="${e(v.url)}"><span class="result-section">${e(v.section)}</span><h2>${e(v.title)}</h2><p>${e(v.summary)}</p></a>`).join(''):`<div class="empty">${icon('search')}<h2>Ничего не найдено</h2><p>Попробуй номер SCP, название команды или другое слово.</p><button class="text-button" data-clear-search>Сбросить поиск</button></div>`}`;
  }
  function notFound(){return `<div class="empty">${icon('book')}<h2>Раздел не найден</h2><p>Выбери раздел в меню или воспользуйся поиском.</p><a class="text-button" href="#home">На главную</a></div>`;}
  function route() {
    const [path,query='']=(location.hash.slice(1)||'departments').split('?');
    const parts=path.split('/');
    const selected=Object.hasOwn(departments,parts[0])?parts.shift():'mrp';
    return {department:selected,parts:parts.length&&parts[0]?parts:['home'],params:new URLSearchParams(query)};
  }
  function render(scroll=false) {
    codeRegistry=[];
    const current=route(), {parts:[view,id],params}=current;
    department=current.department;D=datasets[department];
    const config=departments[department],entry=view==='departments';
    const names={departments:'Выбор отдела',home:'Главная',guide:'Руководство',events:'Ивент-лист',cassie:'C.A.S.S.I.E.',commands:'Команды',sources:'Исходные документы',search:'Поиск'};
    const intros={departments:['Ивент-отделы','Сценарии, правила и команды. Выбери свой отдел — и всё нужное будет под рукой.'],home:['Ивент-отдел · '+config.label,'Правила, сценарии и команды — всё для проведения ивентов.'],guide:['Руководство','Регламент и порядок работы ивент-мастера '+config.label+'.'],events:['Ивент-лист','Сценарии '+config.label+'. Выбери должность и найди свой следующий ивент.'],cassie:['C.A.S.S.I.E.','Объявления для событий, отрядов и протоколов комплекса.'],commands:['Команды','Основные команды для подготовки и проведения событий.'],sources:['Исходные документы','Оригиналы материалов и сведения об актуальности.'],search:['Поиск · '+config.label,'Поиск по материалам выбранного отдела и сервера.']};
    pageIntro(...(intros[view]||['Справочник','']));
    $('#crumb').textContent=entry?'Выбор отдела':config.label+' / '+(names[view]||'Справочник');
    $('#department-select').value=entry?'departments':department==='mrp'?'mrp':'nr';
    $('#sidebar').hidden=entry;
    $('#menu-button').hidden=entry;
    $('.search-wrap').hidden=entry;
    $('#footer-source').href=url('sources');
    $('#event-count').textContent=D.events.length+D.globals.length;
    $('#search').setAttribute('aria-label','Поиск по справочнику '+config.label);
    $('#search').placeholder='Найти в '+config.label+': правило, ивент, команду…';
    document.querySelectorAll('[data-nav]').forEach(n=>{
      const on=n.dataset.nav===view;
      n.href=url(n.dataset.nav);n.hidden=n.dataset.nav==='cassie'&&department!=='mrp';
      n.classList.toggle('active',on);
      if(on)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');
    });
    function serverLink(key) {
      const next=['home','guide','events','commands','sources','search'].includes(view)?view:'home';
      const query=params.toString();
      const detail=next==='guide'&&datasets[key].guides.some(g=>g.id===id)?'/'+id:next==='events'&&[...datasets[key].events,...datasets[key].globals].some(g=>g.id===id)?'/'+id:'';
      return '#'+key+'/'+next+detail+(query?'?'+query:'');
    }
    $('#server-switch').innerHTML=!entry&&department!=='mrp'?'<nav class="server-tabs" aria-label="Сервер отдела"><span>Сервер</span>'+['nr','classic'].map(key=>'<a href="'+e(serverLink(key))+'" class="'+(department===key?'active':'')+'" '+(department===key?'aria-current="page"':'')+'>'+departments[key].label+'</a>').join('')+'</nav>':'';
    if(view!=='search')$('#search').value='';
    else if($('#search').value!==(params.get('q')||''))$('#search').value=params.get('q')||'';
    let html;
    switch(view){
      case 'departments':html=departmentEntry();break;
      case 'home':html=home();break;
      case 'guide':html=id?guideDetail(id):guideIndex();break;
      case 'events':html=id?eventDetail(id):eventIndex(params);break;
      case 'cassie':html=department==='mrp'?(id?cassieDetail(id):cassieIndex(params)):notFound();break;
      case 'commands':html=commandsIndex(params,id);break;
      case 'sources':html=sources();break;
      case 'search':html=searchResults(params.get('q')||'');break;
      default:html=notFound();
    }
    $('#content').innerHTML=scopeLinks(html);
    document.title=$('.page-intro h1').textContent.replace(/\.$/,'')+' — Мандариновый Комплекс';
    if(scroll){window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});}
    const item=params.get('item');
    if(view==='cassie'&&id&&item!==null){const n=document.getElementById('announcement-'+item);if(n){n.scrollIntoView({block:'center'});n.style.borderColor='var(--accent)';}}
  }
  function setMenu(open){$('#sidebar').classList.toggle('open',open);$('#scrim').hidden=!open;$('#menu-button').setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':'';}
  $('#menu-button').addEventListener('click',()=>{const open=!$('#sidebar').classList.contains('open');setMenu(open);if(open)$('#sidebar a').focus();});
  $('#scrim').addEventListener('click',()=>{setMenu(false);$('#menu-button').focus();});
  $('#nav-close').addEventListener('click',()=>{setMenu(false);$('#menu-button').focus();});
  $('#sidebar').addEventListener('click',ev=>{if(ev.target.closest('a'))setMenu(false);});
  $('#search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const q=$('#search').value;history.replaceState(null,'',q?url('search?q='+encodeURIComponent(q)):url('home'));render();},120);});
  document.addEventListener('keydown',ev=>{
    const input=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if(ev.key==='/'&&!$('.search-wrap').hidden&&!input&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey){ev.preventDefault();$('#search').focus();}
    if(ev.key==='Escape'){
      if($('#sidebar').classList.contains('open')){setMenu(false);$('#menu-button').focus();}
      else if(document.activeElement===$('#search')){clearTimeout(searchTimer);$('#search').value='';history.replaceState(null,'',url('home'));render();$('#search').focus();}
    }
    if(ev.key==='Tab'&&$('#sidebar').classList.contains('open')){
      const links=[...$('#sidebar').querySelectorAll('a, button')].filter(n=>!n.closest('[hidden]')),first=links[0],last=links[links.length-1];
      if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
    }
  });
  document.addEventListener('click',async ev=>{
    const copyButton=ev.target.closest('[data-copy]');
    if(copyButton){
      const text=codeRegistry[Number(copyButton.dataset.copy)];
      try{
        if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
        else{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.append(ta);ta.select();const ok=document.execCommand('copy');ta.remove();copyButton.focus();if(!ok)throw new Error('clipboard');}
        showToast('Команда скопирована');
      }catch{showToast('Не удалось скопировать. Выдели текст команды вручную.');}
    }
    const jump=ev.target.closest('[data-jump]');if(jump){ev.preventDefault();const target=document.getElementById(jump.dataset.jump);target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});if(jump.dataset.jump==='main')target?.focus({preventScroll:true});}
    if(ev.target.closest('[data-clear-search]')){clearTimeout(searchTimer);$('#search').value='';location.hash=url('home');$('#search').focus();}
  });
  function showToast(text){clearTimeout(toastTimeout);$('#toast').textContent=text;$('#toast').hidden=false;toastTimeout=setTimeout(()=>$('#toast').hidden=true,2500);}
  window.addEventListener('hashchange',()=>{clearTimeout(searchTimer);render(true);});
  window.addEventListener('resize',()=>{if(window.innerWidth>780)setMenu(false);});
  $('#department-select').addEventListener('change',ev=>{const next=ev.target.value;setMenu(false);location.hash=Object.hasOwn(departments,next)?'#'+next+'/home':'#departments';});
  render();
})();
