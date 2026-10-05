(function () {
  'use strict';
  const D = window.MRP_DATA, C = window.MRP, E = C.escape;
  const $ = s => document.querySelector(s);
  const icons = {
    search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.3 4.3"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    copy:'<rect x="9" y="9" width="11" height="12" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/>',
    radio:'<circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 0 0 10m10-10a7 7 0 0 1 0 10M4 4a11.3 11.3 0 0 0 0 16M20 4a11.3 11.3 0 0 1 0 16"/>',
    book:'<path d="M12 5v15M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9v.01"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    archive:'<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v13h14V8m-10 5h6"/>',
    edit:'<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/>',
    shield:'<path d="M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7Z"/><path d="M12 8v5m0 4v.01"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-18a3 3 0 0 1 0 6m3 12v-3a6 6 0 0 0-3-5"/>',
    medal:'<circle cx="12" cy="9" r="6"/><path d="m7 14-2 8 7-3 7 3-2-8"/>',
    file:'<path d="M14 3H5v18h14V8Zm0 0v5h5M8 13h8m-8 4h5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    list:'<path d="M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.file}</svg>`;
  const sections = [
    {id:'guide',title:'Руководство',description:'Инструкции, правила и состав руководства',icon:'book'},
    {id:'cassie',title:'C.A.S.S.I.E.',description:'Оповещения комплекса',text:'Кэсси Касси CASSIE',icon:'radio'},
    {id:'violators',title:'Частые нарушители',description:'Справочник для работы с повторными нарушениями',icon:'shield'},
    {id:'veterans',title:'Ветераны',description:'Участники, внёсшие вклад в Medium RP',icon:'medal'}
  ];
  const categoryOrder = ['general-breach','breach','contained','escape','instructions','aggression','mtf','chaos','groups','requests','warnings','orders','reminders','intercom','failures','protocols','scanning','location','generators'];
  const roundSections=[
    {title:'SCP-объекты',items:[['general-breach','Общий НОУС','Нарушение содержания: выберите класс и число объектов.'],['breach','НОУС по SCP','Нарушение содержания конкретного SCP-объекта.'],['contained','ВОУС','Восстановление содержания: сдерживание, ликвидация или эвакуация объекта.'],['escape','Побег SCP','Объект покинул комплекс.'],['instructions','Инструкции','Указания персоналу при нарушении содержания SCP.'],['aggression','Агрессия SCP','Агрессия объекта и ликвидация по соображениям безопасности.']]},
    {title:'Отряды',items:[['groups','Вызов отряда','Команды появления МОГ и Повстанцев Хаоса.'],['mtf','Прибытие МОГ','Мобильные оперативные группы: названия отрядов и звуковые дорожки. В документе эти варианты отмечены заменёнными.'],['chaos','Повстанцы Хаоса','Прибытие ПХ и их нахождение в боеголовке.']]},
    {title:'Персонал',items:[['requests','Запросы','Ответ на запрос: принятие или причина отказа.'],['warnings','Предупреждения','Выберите адресата и номер предупреждения.'],['orders','Приказы','Выберите действие и адресата. В основном каталоге эти команды требуют правок по отметке автора.'],['reminders','Напоминания','Обращения к персоналу и правила поведения в комплексе.']]},
    {title:'Комплекс',items:[['protocols','Протоколы','Активация, деактивация и звуковое сопровождение протоколов.'],['intercom','Интерком','Взлом, восстановление и блокировка интеркома.'],['failures','Поломки','Освещение, гермоворота и лифты: поломка и восстановление.'],['scanning','Сканирование','Проверка состояния SCP-079 и СБК.'],['location','Местоположение','Поиск SCP или неавторизованного персонала по зонам. Копируйте шаги в указанном порядке.'],['generators','Генераторы','Оповещения об активации первого, второго и третьего генератора.']]}
  ];
  const roundCategories=roundSections.flatMap(g=>g.items);
  const categoryHint=id=>roundCategories.find(c=>c[0]===id)?.[2]||'';
  const categoryTitle=id=>roundCategories.find(c=>c[0]===id)?.[1]||D.categories.find(c=>c.id===id)?.label||'Все оповещения';
  const groupLabel=text=>{
    const labels={'ЕВКЛИД':'Евклид','КЕТЕР':'Кетер','ЕВКЛИД & КЕТЕР':'Евклид и Кетер','МЕНЕДЖЕР КОМПЛЕКСА':'Менеджер комплекса','СЛУЖБА БЕЗОПАСНОСТИ':'Служба безопасности','МОБИЛЬНАЯ ОПЕРАТИВНАЯ ГРУППА':'МОГ','ЛИКВИДИРОВАТЬ':'Ликвидировать','ЭВАКУИРОВАТЬ':'Эвакуировать','НАЙТИ':'Найти','АРЕСТОВАТЬ':'Арестовать','ОТСТУПИТЬ':'Отступить','ВЕРТОЛЕТ':'Вертолёт','НЕАВТОРИЗОВАННЫЙ ПЕРСОНАЛ':'Неавторизованный персонал','ОСВЕЩЕНИЕ':'Освещение','ГЕРМОВОРОТА':'Гермоворота','ЛИФТЫ':'Лифты','КЛАССИКА':'Классика','ПРИНЯТ':'Принят','ПРИНЯТ + МОГ':'Принят + МОГ','ОТКЛОНЕН':'Отклонён'};
    return labels[text]||(/^\d{3,4}$/.test(text)?'SCP-'+text:text);
  };
  const variantGroup=r=>['general-breach','contained','warnings','orders','failures','location','protocols','requests'].includes(r.category)?groupLabel(r.subcategory.split(' · ')[0]):'';
  const starterChapters=['guide-manual-1','guide-manual-2','guide-manual-4','guide-manual-5','guide-manual-9'];
  const guideTabs=[
    {id:'start',label:'Новичку',icon:'book',description:'Начните с задач отдела и обязанностей. Затем переходите к нарушениям и основам работы с Кэсси.'},
    {id:'manual',label:'Правила отдела',icon:'shield',description:'Права, обязанности, отчётность и порядок работы администрации.'},
    {id:'aspects',label:'Работа на сервере',icon:'radio',description:'Кэсси, игровые роли, канон и правила взаимодействия на сервере.'},
    {id:'names',label:'Позывные',icon:'users',description:'Условия смены имени и разрешённые фамилии и позывные для каждой роли.'},
    {id:'events',label:'Ивенты',icon:'grid',description:'Участие в мероприятиях и проведение мини-ивентов.'},
    {id:'links',label:'Документы',icon:'file',description:'Ссылки отдела, распределение обязанностей и сведения об исходном руководстве.'}
  ];
  const guideInGroup=(r,group)=>group==='all'||(group==='start'?starterChapters.includes(r.id):group==='links'?['links','about'].includes(r.groupId):r.groupId===group);
  const orderedRecords = [...D.records].sort((a,b) => categoryOrder.indexOf(a.category)-categoryOrder.indexOf(b.category) || a.sourceParagraph-b.sourceParagraph);
  const state = {route:'home',category:'all',shelf:'catalog',mode:'catalog',status:'all',selected:null,query:'',tab:'instructions',searchGroup:'all',wordQuery:'',wordLimit:120,detailOpen:false};
  let visibleRecords = [], toastTimer, searchTimer;
  const copyTimers=new WeakMap();
  const snowCard = () => '<span class="card-weather" aria-hidden="true"><span class="snow-cap"></span><span class="card-snow"></span></span>';
  const external = (url, label, cls='source-link') => /^https?:\/\//.test(url || '') ? `<a class="${cls}" href="${E(url)}" target="_blank" rel="noopener noreferrer">${E(label)}</a>` : E(label);
  state.cassieQuery='';state.variant='all';
  state.localQuery='';state.guideGroup='start';state.chapter='';state.peopleView='all';
  const commandParts = r => r.parts.filter(p => p.type==='command');
  function fillIcons(root=document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML=icon(el.dataset.icon); }); }
  function statusInfo(r) {
    if (r.shelf==='drafts') return {label:'Черновик',tone:'blue'};
    if (r.shelf==='archive') return {label:'Архив',tone:'muted'};
    return D.legend[r.status] || {label:'Статус не указан',tone:'muted'};
  }
  function badge(r) { const s=statusInfo(r);return `<span class="status ${s.tone}">${E(s.label)}</span>`; }
  function countLabel(n) { return `${n} ${C.plural(n,['карточка','карточки','карточек'])}`; }
  function readRoute() {
    const [path,qs=''] = location.hash.replace(/^#\/?/,'').split('?');
    const params = new URLSearchParams(qs);
    state.route = [...sections.map(s=>s.id),'home','search'].includes(path) ? path : 'home';
    state.query = state.route==='search' ? params.get('q') || '' : '';
    state.cassieQuery = state.route==='cassie' ? params.get('q') || '' : '';
    state.variant=params.get('variant')||'all';
    state.category = params.get('category') || (state.route==='cassie'&&!params.has('shelf')&&!params.has('q')&&!params.has('status')?'general-breach':'all');
    if (!D.categories.some(c=>c.id===state.category)) state.category='all';
    state.shelf = ['catalog','archive','drafts'].includes(params.get('shelf')) ? params.get('shelf') : 'catalog';
    state.mode = params.get('mode')==='dictionary' ? 'dictionary' : 'catalog';
    state.status = Object.hasOwn(D.legend,params.get('status')) ? params.get('status') : 'all';
    state.tab = params.get('tab')==='leadership' ? 'leadership' : 'instructions';
    state.localQuery='';
    state.chapter=D.instructions.some(r=>r.id===params.get('chapter'))?params.get('chapter'):'';
    const chapter=D.instructions.find(r=>r.id===state.chapter), requestedGroup=params.get('section');
    state.guideGroup=[...guideTabs.map(g=>g.id),'all','about'].includes(requestedGroup)?requestedGroup:chapter?.groupId||'start';
    if(state.guideGroup==='about')state.guideGroup='links';
    state.peopleView=params.get('view')==='warnings'?'warnings':'all';
    state.searchGroup = [...sections.map(s=>s.id),'all','dictionary'].includes(params.get('group')) ? params.get('group') : 'all';
    state.selected = D.records.some(r=>r.id===params.get('id')) ? params.get('id') : null;
    state.detailOpen = Boolean(state.selected);
    if(state.selected&&state.route==='cassie'){const record=D.records.find(r=>r.id===state.selected);state.shelf=record.shelf;state.category=record.shelf==='catalog'?record.category:'all';}
    $('#global-search').value = state.route==='cassie'?state.cassieQuery:state.query;
    render();
  }
  function syncRoute() {
    const p=new URLSearchParams();
    const query=state.route==='cassie'?state.cassieQuery:state.query;
    if (query) p.set('q',query);
    if (state.route==='cassie'&&state.variant!=='all') p.set('variant',state.variant);
    if (state.route==='veterans'&&state.peopleView!=='all') p.set('view',state.peopleView);
    if (state.category!=='all'||state.route==='cassie') p.set('category',state.category);
    if (state.shelf!=='catalog') p.set('shelf',state.shelf);
    if (state.mode!=='catalog') p.set('mode',state.mode);
    if (state.status!=='all') p.set('status',state.status);
    if (state.tab!=='instructions' && state.route==='guide') p.set('tab',state.tab);
    if (state.route==='guide' && state.guideGroup!=='start') p.set('section',state.guideGroup);
    if (state.route==='guide' && state.chapter) p.set('chapter',state.chapter);
    if (state.searchGroup!=='all' && state.route==='search') p.set('group',state.searchGroup);
    if (state.selected && state.detailOpen) p.set('id',state.selected);
    history.replaceState(null,'',`#/${state.route}${p.size?'?'+p:''}`);
  }
  function render() {
    const section=sections.find(s=>s.id===state.route);
    const home=state.route==='home';
    const name=home ? 'Главное меню' : section?.title || 'Результаты поиска';
    $('#main').dataset.page=state.route;
    $('#main').dataset.mode=state.mode;
    const scoped=state.route==='cassie';
    $('#global-search').placeholder=scoped?'Быстрый поиск: 096, запрос, протокол…':'Поиск по всем разделам…';
    $('#global-search').setAttribute('aria-label',scoped?'Поиск в Кэсси':'Поиск по всему справочнику');
    $('#search-scope').textContent=scoped?'В Кэсси':'По всем разделам';
    $('#page-breadcrumb').innerHTML=home ? '<span>Мандариновый Комплекс</span><span class="crumb-slash">/</span><span>Medium RP</span>' : '<a href="#/home">Medium RP</a><span class="crumb-slash">/</span><span>'+E(name)+'</span>';
    $('#nav-cassie-count').textContent=D.records.length;
    $('#page-title').innerHTML = home ? 'Medium RP<span class="accent">.</span>' : state.route==='cassie' ? 'C.A.S.S.I.E<span class="accent">.</span>' : E(name);
    $('#page-description').textContent = home ? 'Оповещения, руководство и материалы команды.' : section?.description || (state.query ? `По запросу «${state.query}»` : 'Поиск по всему справочнику');
    document.title = `${name} · Mandarin Medium RP`;
    document.querySelectorAll('[data-route]').forEach(a => { const active=a.dataset.route===state.route; a.classList.toggle('active',active); if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
    $('#page-actions').innerHTML = state.route==='cassie' ? `<div class="stat"><strong>${D.records.filter(r=>r.shelf==='catalog').length}</strong><span>в основном каталоге</span></div><div class="stat"><strong>${D.categories.filter(c=>!['archive','drafts'].includes(c.id)).length}</strong><span>категорий</span></div>` : '';
    if(home) renderHome();
    else if(state.route==='cassie') renderCatalog();
    else if(state.route==='search') renderSearch();
    else renderSection();
    fillIcons();
    if(state.detailOpen&&state.selected&&['cassie','search'].includes(state.route))showRecord();
    else if($('#record-dialog').open)$('#record-dialog').close();
  }
  function renderHome() {
    const items=[
      {id:'guide',number:'01',title:'Руководство',icon:'book',text:'Инструкции, рабочие аспекты и документы',count:D.instructions.length,forms:['глава','главы','глав']},
      {id:'cassie',number:'02',title:'Кэсси',icon:'radio',text:'Оповещения, команды и словарь C.A.S.S.I.E.',count:D.records.length},
      {id:'violators',number:'03',title:'Частые нарушители',icon:'shield',text:'Записи из таблицы отдела · архив',count:D.violators.length,forms:['запись','записи','записей']},
      {id:'veterans',number:'04',title:'Ветераны',icon:'medal',text:'Участники, контакты и дата получения роли',count:D.veterans.length,forms:['участник','участника','участников']}
    ];
    $('#view').innerHTML=`<div class="home-intro-links"><a class="newcomer-link outline-button" href="#/guide?section=start">${icon('book')}Я впервые здесь · с чего начать</a></div><div class="home-hub"><section class="department-directory" aria-labelledby="menu-heading"><div class="section-heading"><h2 id="menu-heading">Разделы отдела</h2><span>01 — 04</span></div><div class="section-list">${items.map(item=>`<a class="section-entry snowy-card entry-${item.id}" href="#/${item.id}" aria-labelledby="entry-title-${item.id}">${snowCard()}<span class="entry-number">${item.number}</span><span class="entry-icon">${icon(item.icon)}</span><div class="entry-content"><h2 id="entry-title-${item.id}">${item.title}</h2><span class="entry-description">${item.text}</span><span class="entry-state">${item.id==='cassie'?countLabel(item.count):`${item.count} ${C.plural(item.count,item.forms)}`}</span></div><span class="entry-open">Открыть</span></a>`).join('')}</div></section><aside class="citrus-wish snowy-card" aria-labelledby="citrus-wish-title">${snowCard()}<div class="citrus-art"><img src="assets/citrus-snowflake.png" width="1254" height="1254" alt="Мандариновая снежинка с заснеженными краями"></div><h2 id="citrus-wish-title">Кушайте мандарины, дети!</h2></aside></div>`;
  }
  function rail() {
    const count=shelf=>D.records.filter(r=>r.shelf===shelf).length;
    const tab=(label,hint,symbol,attrs,active,number)=>`<button class="shelf-tab ${active?'active':''}" ${attrs} aria-pressed="${active}"><span class="shelf-symbol">${icon(symbol)}</span><span class="shelf-title">${label}</span><span class="shelf-count">${number}</span><span class="shelf-hint">${hint}</span></button>`;
    return `<div class="cassie-controls"><div class="shelf-tabs" aria-label="Разделы C.A.S.S.I.E.">${tab('Во время раунда','Команды комплекса','radio','data-shelf="catalog"',state.shelf==='catalog'&&state.mode==='catalog',count('catalog'))}${tab('Словарь','Слова и фразы','book','data-mode="dictionary"',state.mode==='dictionary',D.dictionary.length)}${tab('Архив','Снято с использования','archive','data-shelf="archive"',state.shelf==='archive'&&state.mode==='catalog',count('archive'))}${tab('Черновики','Требуют проверки','edit','data-shelf="drafts"',state.shelf==='drafts'&&state.mode==='catalog',count('drafts'))}</div></div>`;
  }
  function roundNavigation() {
    if(state.shelf!=='catalog')return '';
    const markers=window.MRP_CASSIE_TABS||{};
    const groupIcons=['⚠️','👥','🧭','🌐'];
    return `<nav class="round-navigation" aria-label="Разделы оповещений">${roundSections.map((group,i)=>`<section class="round-nav-group"><h2><span aria-hidden="true">${groupIcons[i]}</span>${E(group.title)}</h2><div>${group.items.map(([id,label,hint])=>{const marker=markers[id];return `<button type="button" class="round-tab ${!state.cassieQuery&&state.category===id?'active':''}" data-category="${id}" data-marker="${E(marker?.tone||'neutral')}" aria-pressed="${!state.cassieQuery&&state.category===id}" title="${E(hint)}">${marker?`<span class="source-tab-icon" aria-hidden="true">${E(marker.icon)}</span>`:''}<span>${E(label)}</span></button>`;}).join('')}</div></section>`).join('')}</nav>`;
  }
  function catalogHelp() {
    return `<div class="round-guide"><span>Раздел · нужный вариант · копирование</span><div class="round-help-actions"><button class="text-button" data-info="tabs">Метки как в документе</button><button class="hint-button" data-info="round">${icon('info')}Первый раз с Кэсси?</button></div></div>`;
  }
  function variantTabs(records) {
    if(state.cassieQuery||state.category==='all'||state.category==='general-breach'||state.shelf!=='catalog'){state.variant='all';return '';}
    const groups=[...new Set(records.map(variantGroup).filter(Boolean))];
    if(state.variant!=='all'&&!groups.includes(state.variant))state.variant='all';
    if(groups.length<2)return '';
    return `<div class="variant-tabs" aria-label="Варианты оповещений"><button class="variant-tab ${state.variant==='all'?'active':''}" data-variant="all" aria-pressed="${state.variant==='all'}">Все варианты</button>${groups.map(group=>`<button class="variant-tab ${state.variant===group?'active':''}" data-variant="${E(group)}" aria-pressed="${state.variant===group}">${E(group)}</button>`).join('')}</div>`;
  }
  function renderCatalog() {
    $('#main').dataset.mode=state.mode;
    if(state.mode==='dictionary') {
      $('#view').innerHTML=`<div class="catalog-layout">${rail()}<section class="catalog-surface"><div class="catalog-toolbar"><h2 style="font-size:1.15rem;font-weight:550">Словарь C.A.S.S.I.E.</h2><button class="text-button" data-info="source">О материале</button></div><div class="dictionary-surface"><div class="dictionary-toolbar"><input id="word-search" class="local-search" type="search" placeholder="Найти слово или фразу…" aria-label="Поиск по словарю" value="${E(state.wordQuery)}"><span class="result-count" id="word-count"></span></div><p class="search-intro">Нажмите на слово, чтобы скопировать. Регистр не имеет значения.</p><div id="dictionary-content"></div></div></section></div>`;
      renderWords();return;
    }
    const searching=Boolean(C.normalize(state.cassieQuery));
    const records=orderedRecords.filter(r=>r.shelf===state.shelf&&(searching||state.category==='all'||r.category===state.category));
    const variants=variantTabs(records);
    visibleRecords=C.search(records,state.cassieQuery).filter(r=>(searching||state.variant==='all'||variantGroup(r)===state.variant)&&(state.status==='all'||r.status===state.status));
    const shelfNote=state.shelf==='archive'?`<div class="notice">${E(D.archiveNotice||'Материалы выведены из активного использования.')}</div>`:state.shelf==='drafts'?'<div class="notice blue">Черновики требуют проверки. Пометка «Готова» внутри исходного документа не меняет статус раздела.</div>':'';
    const heading=searching?`Поиск: «${state.cassieQuery}»`:state.shelf==='archive'?'Архив':state.shelf==='drafts'?'Черновики':categoryTitle(state.category);
    const help=searching?'Поиск по всем разделам текущего каталога. Выбранная вкладка не ограничивает результаты.':state.shelf==='catalog'?categoryHint(state.category):'';
    $('#view').innerHTML=`<div class="catalog-layout round-console">${rail()}${roundNavigation()}${catalogHelp()}${shelfNote}<div id="catalog-results" class="round-results-head" tabindex="-1"><div><h2>${E(heading)} <span>${visibleRecords.length}</span></h2>${help?`<p>${E(help)}</p>`:''}</div><div class="round-tools">${searching?'<button class="text-button" data-clear-cassie>Сбросить поиск</button>':''}${state.shelf==='catalog'?`<button class="text-button" data-category="all">Все оповещения</button>`:''}<button class="text-button" data-info="source">Статусы</button></div></div>${variants}${state.status!=='all'?`<p class="notice">Фильтр по статусу: ${E(D.legend[state.status].label)}. <button class="text-button" data-clear-status>Показать все статусы</button></p>`:''}${workspaceHTML()}</div>`;
  }
  function quickTitle(r) {
    if(r.category==='general-breach'){
      const n=Number(r.subcategory.split(' · ')[1]);
      if(n)return `${n} ${C.plural(n,['объект','объекта','объектов'])}`;
    }
    if(['breach','escape','instructions'].includes(r.category))return r.title.match(/SCP-\d+/)?.[0]||r.title;
    return r.title;
  }
  function objectClass(r) {
    if(r.category!=='general-breach')return null;
    const group=r.subcategory.split(' · ')[0].toLocaleUpperCase('ru');
    if(group.includes('ЕВКЛИД')&&group.includes('КЕТЕР'))return {tone:'mixed',label:'Евклид и Кетер'};
    if(group.includes('КЕТЕР'))return {tone:'keter',label:'Кетер'};
    if(group.includes('ЕВКЛИД'))return {tone:'euclid',label:'Евклид'};
    return null;
  }
  function cardTone(r) {
    return objectClass(r)?.tone||window.MRP_CASSIE_TABS?.[r.category]?.tone||'neutral';
  }
  function recordRow(r) {
    const commands=commandParts(r);
    let step=0;
    const actions=r.parts.map((p,index)=>{
      if(p.type==='note')return `<p class="quick-note">${E(p.text)}</p>`;
      step++;
      if(!p.complete)return '<span class="quick-unavailable">Команда не дописана</span>';
      return `<button class="copy-button quick-copy" data-copy-part="${index}" data-copy-record="${r.id}" aria-label="Скопировать ${commands.length>1?'шаг '+step+' — ':''}${E(r.title)}">${icon('copy')}${commands.length>1?'Копировать шаг '+step:'Копировать'}</button>`;
    }).join('');
    const context=state.cassieQuery||state.route==='search'||state.category==='all';
    return `<article class="round-card" data-card-tone="${cardTone(r)}" aria-labelledby="quick-${r.id}">${snowCard()}<div class="quick-card-head"><div>${context?`<p class="quick-category">${E(r.categoryLabel)}</p>`:''}<h3 id="quick-${r.id}">${E(quickTitle(r))}</h3>${r.subcategory&&(r.category!=='general-breach'||context)?`<p class="quick-subtitle">${E(r.subcategory)}</p>`:''}</div><button class="record-more" data-record="${r.id}" aria-label="Прочитать оповещение: ${E(r.title)}" title="Полный текст и источник">${icon('info')}</button></div><div class="quick-state">${badge(r)}${r.duration?`<span>${r.duration} сек.</span>`:''}</div><div class="quick-actions">${actions||'<span class="quick-unavailable">Готовой команды пока нет</span>'}</div></article>`;
  }
  function workspaceHTML() {
    if(!visibleRecords.length)return `<div class="round-empty">${empty('Ничего не найдено','Попробуйте номер SCP, название протокола или слово из оповещения.','reset')}</div>`;
    const groups=new Map();
    for(const r of visibleRecords){
      const title=state.route==='cassie'&&state.category==='general-breach'&&!state.cassieQuery?variantGroup(r):'';
      if(!groups.has(title))groups.set(title,[]);groups.get(title).push(r);
    }
    return `<div class="round-board ${state.route==='cassie'&&state.category==='general-breach'&&!state.cassieQuery?'general-breach-board':''}">${[...groups].map(([title,records])=>`<section class="round-variant-group"${title?` data-card-tone="${cardTone(records[0])}"`:''}>${title?`<h3 class="variant-heading">${E(title)}</h3>`:''}<div class="quick-grid">${records.map(recordRow).join('')}</div></section>`).join('')}</div><span class="result-announcement" role="status">${countLabel(visibleRecords.length)}</span>`;
  }
  function detailHTML() {
    const r=D.records.find(r=>r.id===state.selected);if(!r)return '';
    const cmds=commandParts(r), status=D.legend[r.status];
    const commandLabels={cassieadvanced:'Оповещение',cassie_sl:'Оповещение',intercomtext:'Текст интеркома',audio:'Звуковая дорожка',otryadinfo:'Название отряда',wave:'Прибытие отряда'};
    let number=0;
    const parts=r.parts.map((p,index)=>{
      if(p.type==='note')return `<div class="command-note">${icon('info')}<span>${E(p.text)}</span></div>`;
      number++;
      if(!p.complete)return '<div class="notice">В исходном документе команда не дописана. Копирование недоступно.</div>';
      const name=p.text.split(/\s+/)[0], short=p.text.length<180;
      return `<section class="command-step" aria-label="${cmds.length>1?'Шаг '+number:'Команда'}"><div class="step-heading"><h3>${cmds.length>1?`<span class="step-number">${number}</span>`:''}${E(commandLabels[name.toLowerCase()]||'Команда')}</h3><button class="copy-button" data-copy-part="${index}" data-copy-record="${r.id}" aria-label="Скопировать ${cmds.length>1?'шаг '+number:'команду'}">${icon('copy')}${cmds.length>1?'Копировать шаг '+number:'Копировать команду'}</button></div>${p.displayText?`<p class="announcement">${E(p.displayText)}</p>`:''}${short?`<pre class="command-code short-command"><code>${E(p.text)}</code></pre>`:`<details class="command-source"><summary>Полный текст команды <span>${E(name)}</span></summary><pre class="command-code"><code>${E(p.text)}</code></pre></details>`}</section>`;
    }).join('');
    const archive=r.shelf==='archive'||r.status==='⚪';
    return `${snowCard()}<button class="mobile-detail-close" data-back-list>${icon('list')}К списку оповещений</button><div class="detail-kicker"><span>${E(r.group)} / ${E(r.categoryLabel)}</span><button class="icon-button" data-info="source" aria-label="Источник и статусы">${icon('info')}</button></div><h2 tabindex="-1" id="record-title">${E(r.title)}</h2><div class="detail-tags">${badge(r)}${r.shelf!=='catalog'&&status?`<span class="tag">В документе: ${E(status.label)}</span>`:''}${r.duration?`<span class="tag">${r.duration} сек.</span>`:''}<span class="tag">${E(r.subcategory||r.categoryLabel)}</span></div>${archive?'<div class="notice">Дорожка заменена или находится в архиве. Проверьте условия использования в примечаниях.</div>':''}${r.shelf==='drafts'?'<div class="notice blue">Черновик из исходного документа. Требует проверки перед использованием.</div>':''}${cmds.length>1?'<p class="steps-hint">Выполняйте шаги по порядку. Указания между ними взяты из документа.</p>':''}${r.id==='cassie-0255'?'<div class="notice">В заголовке документа указано «6», но подраздел и сама команда относятся к 7 объектам. В быстром выборе показано «7 объектов».</div>':''}<div class="command-steps">${parts||'<div class="notice">В исходном документе команда пока не заполнена.</div>'}</div><div class="source-caption">${external(r.sourceUrl||D.source.url,'Открыть в исходном документе')}<span>Текст для чтения — без игровых тегов. Копируется полная исходная команда.</span></div>`;
  }
  function showRecord() {
    const record=D.records.find(r=>r.id===state.selected);
    if(record)$('#record-dialog').dataset.cardTone=cardTone(record);
    $('#record-detail').innerHTML=detailHTML();
    if(!$('#record-dialog').open)$('#record-dialog').showModal();
    $('#record-title')?.focus({preventScroll:true});
  }
  function closeRecord() {
    state.detailOpen=false;syncRoute();$('#record-dialog').close();
    $(`[data-record="${state.selected}"]`)?.focus({preventScroll:true});
  }
  function selectRecord(id) {
    if(!visibleRecords.some(r=>r.id===id))return;
    state.selected=id;state.detailOpen=true;syncRoute();showRecord();
  }
  function empty(title,description,action) {
    return `<div class="empty-result">${icon('search')}<h2>${E(title)}</h2><p>${E(description)}</p>${action==='reset'?'<button class="outline-button" data-reset>Сбросить поиск и фильтры</button>':''}</div>`;
  }
  function renderWords() {
    const words=D.dictionary.filter(w=>C.normalize(w).includes(C.normalize(state.wordQuery)));
    $('#word-count').textContent=`${words.length} ${C.plural(words.length,['слово / фраза','слова / фразы','слов и фраз'])}`;
    $('#dictionary-content').innerHTML=words.length?`<div class="dictionary-grid">${words.slice(0,state.wordLimit).map(w=>`<button class="word-button" data-copy-word="${E(w)}" aria-label="Скопировать ${E(w)}">${E(w)}${icon('copy')}</button>`).join('')}</div>${words.length>state.wordLimit?`<button class="outline-button more-button" data-more-words>Показать ещё ${Math.min(120,words.length-state.wordLimit)}</button>`:''}`:empty('Такого слова нет в словаре','Попробуйте английское слово или его часть.');
  }
  function searchDatasets() {
    return {
      cassie:C.search(D.records,state.query),
      guide:C.search([...D.instructions,...D.leadership],state.query),
      violators:C.search(D.violators,state.query),
      veterans:C.search(D.veterans,state.query),
      dictionary:D.dictionary.filter(w=>C.normalize(state.query) && C.normalize(w).includes(C.normalize(state.query)))
    };
  }
  function renderSearch() {
    const results=searchDatasets();
    const links=sections.filter(s=>C.matches(s,state.query));
    const total=Object.values(results).reduce((n,a)=>n+a.length,0);
    const groups=[{id:'all',title:'Всё'},...sections,{id:'dictionary',title:'Словарь'}];
    const filters=`<div class="search-groups" aria-label="Разделы поиска">${groups.map(s=>`<button class="filter-pill ${state.searchGroup===s.id?'active':''}" data-search-group="${s.id}" aria-pressed="${state.searchGroup===s.id}">${E(s.title)} <span>${s.id==='all'?total:results[s.id].length}</span></button>`).join('')}</div>`;
    const sectionLinks=state.searchGroup==='all'&&links.length?`<div class="result-links">${links.map(s=>`<a class="section-search-result" href="#/${s.id}"><strong>${icon(s.icon)} ${E(s.title)}</strong><span>Перейти в раздел</span></a>`).join('')}</div>`:'';
    visibleRecords=['all','cassie'].includes(state.searchGroup)?results.cassie:[];
    if(!visibleRecords.some(r=>r.id===state.selected))state.selected=visibleRecords[0]?.id||null;
    let body=visibleRecords.length?workspaceHTML():'';
    if(state.searchGroup==='all'||state.searchGroup==='dictionary') {
      const words=results.dictionary;
      if(words.length)body+=`<section class="dictionary-surface" style="margin-top:20px"><h2 style="font-size:1rem;margin-bottom:18px">Словарь · ${words.length}</h2><div class="dictionary-grid">${words.slice(0,80).map(w=>`<button class="word-button" data-copy-word="${E(w)}">${E(w)}${icon('copy')}</button>`).join('')}</div>${words.length>80?'<p class="search-intro" style="margin-top:18px">Показаны первые 80 совпадений. Уточните запрос или откройте полный словарь.</p><a class="outline-button" href="#/cassie?mode=dictionary">Открыть словарь</a>':''}</section>`;
    }
    for(const key of ['guide','violators','veterans']) if(state.searchGroup==='all'||state.searchGroup===key) {
      if(results[key].length)body+=`<section class="department-search-group"><h2>${E(sections.find(s=>s.id===key).title)} · ${results[key].length}</h2>${key==='violators'?archiveNotice():''}<div class="${key==='guide'?'guide-results':'people-grid'}">${results[key].map(r=>key==='guide'?guideSearchCard(r):personCard(r,key)).join('')}</div></section>`;
    }
    if(!body&&!sectionLinks) {
      const unloaded=false;
      body=empty(unloaded?'Материалы ещё не добавлены':'Ничего не найдено',unloaded?'Раздел подготовлен. Поиск по записям появится после добавления материалов.':'Попробуйте название, номер SCP, слово из команды или другую формулировку.','reset');
    }
    $('#view').innerHTML=filters+sectionLinks+body+`<span class="result-announcement" role="status">Найдено: ${total}</span>`;
  }
  function archiveNotice() {
    return '<div class="notice archive-notice"><strong>В источнике: «НЕАКТУАЛЬНО».</strong><span>Это архивная таблица. Указанные сроки и записи не подтверждают действующие меры.</span></div>';
  }
  function sourceBar(key) {
    const source=D.departmentSources[key];
    return `<div class="department-source"><span>Материалы на 3 октября 2026 · обновление вручную</span>${external(source.url,'Открыть оригинал')}</div>`;
  }
  function cellHTML(cell) {
    if(!cell?.text)return '<span class="unspecified">Не указано</span>';
    return `${cell.url?external(cell.url,cell.text):E(cell.text)}${cell.note?`<small class="cell-note">${E(cell.note)}</small>`:''}`;
  }
  function personCard(r,key) {
    const isArchive=key==='violators';
    const labels=isArchive?['№','Никнейм','SteamID','Баны','Комментарий','Минимальный срок в архиве','Поставлен на учёт','Последний бан']:['№','Steam Username','Steam ID','Discord Username','Discord ID','Предупреждения','Дата получения роли'];
    const indices=isArchive?[2,3,5,6,7]:[2,3,4,5,6];
    const source=D.departmentSources[key];
    return `<article class="person-card snowy-card">${snowCard()}<div class="person-heading"><span class="person-icon">${icon(isArchive?'shield':'medal')}</span><h2>${E(r.name)}</h2><span class="person-number">№ ${E(r.number)}</span></div>${isArchive?'<span class="archive-tag">Архив</span>':''}${isArchive?`<div class="person-comment"><span>Комментарий в таблице</span><p>${cellHTML(r.cells[4])}</p></div>`:''}${!isArchive?`<p class="person-summary"><span>Discord:</span> ${cellHTML(r.cells[3])}<br><span>Роль получена:</span> ${cellHTML(r.cells[6])}${r.warnings?`<br><span>Предупреждения в таблице:</span> ${cellHTML(r.cells[5])}`:''}</p>`:''}<details class="person-details"><summary>${isArchive?'Steam ID, баны и даты':'Идентификаторы и сведения'}</summary><dl class="person-fields">${indices.map(i=>`<div><dt>${labels[i]}</dt><dd>${cellHTML(r.cells[i])}</dd></div>`).join('')}</dl></details>${external(source.url+'#gid=0&range=A'+r.sourceRow,'Строка в таблице','person-source')}</article>`;
  }
  function richText(runs) {
    return runs.map((r,index)=>{
      const content=index===runs.length-1?r.text.replace(/\n+$/,''):r.text;
      let text=E(content).replace(/\n/g,'<br>');
      if(r.bold)text='<strong>'+text+'</strong>';
      if(r.italic)text='<em>'+text+'</em>';
      return r.url&&/^https?:\/\//.test(r.url)?`<a href="${E(r.url)}" target="_blank" rel="noopener noreferrer">${text}</a>`:text;
    }).join('');
  }
  function guideBlocks(blocks,chapterId='') {
    return blocks.map((b,index)=>{
      if(b.type==='table')return `<div class="guide-table-wrap" tabindex="0" role="region" aria-label="Таблица из руководства"><table>${b.rows.map((row,i)=>`<tr>${row.map(cell=>`<${i?'td':'th'}>${guideBlocks(cell)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table></div>`;
      if(b.level)return `<h3 ${chapterId?`id="${E(chapterId)}-point-${index}" tabindex="-1"`:''}>${richText(b.runs)}</h3>`;
      return `<p class="${b.bullet?'guide-bullet':''}"${b.bullet?` style="--indent:${Math.min(b.indent||0,3)}"`:''}>${richText(b.runs)}</p>`;
    }).join('');
  }
  function chapterHTML(r,index) {
    const points=r.blocks.map((b,i)=>({block:b,index:i})).filter(p=>p.block.level&&/[А-Яа-яЁёA-Za-z]/.test(p.block.text));
    const readingId=r.id+'-heading';
    const number=D.instructions.findIndex(item=>item.id===r.id), next=D.instructions[number+1];
    const contents=points.length?`<nav class="chapter-index" aria-label="Содержание главы ${E(r.title)}">${points.map(p=>`<button type="button" class="reader-jump" data-guide-jump="${E(r.id)}-point-${p.index}">${E(p.block.text.trim())}</button>`).join('')}</nav>`:'<p class="reader-note">Эта глава читается целиком.</p>';
    return `<details class="guide-chapter snowy-card" ${state.chapter===r.id||index===0?'open':''}><summary id="${E(readingId)}"><span class="chapter-group">${E(r.group)}</span><h2>${E(r.title)}</h2><span class="chapter-action">Открыть / свернуть</span></summary>${snowCard()}<div class="chapter-reading"><div class="guide-body">${guideBlocks(r.blocks,r.id)}<div class="reader-end"><button type="button" class="reader-top" data-guide-jump="${E(readingId)}">В начало главы</button>${next?`<a href="#/guide?chapter=${E(next.id)}" class="reader-next"><span>Следующая глава</span>${E(next.title)}</a>`:''}</div></div><aside class="chapter-aside"><details class="chapter-tools" ${matchMedia('(max-width:820px)').matches?'':'open'}><summary>Содержание и подсказки</summary><div class="chapter-tools-content">${contents}<div class="reader-tip"><strong>Ищете конкретное правило?</strong><p>Поиск над главами проверяет всё руководство.</p><button type="button" class="reader-search" data-focus-search>Перейти к поиску</button></div><div class="reader-source">${external(r.sourceUrl,'Оригинал главы')}<p>Иллюстрации и схемы доступны в Google Docs.</p></div></div></details></aside></div></details>`;
  }
  function guideSearchCard(r) {
    const text=r.text.replace(/\s+/g,' ').trim();
    const at=text.toLocaleLowerCase('ru').indexOf(state.query.toLocaleLowerCase('ru'));
    const start=Math.max(0,at-65), snippet=(start?'…':'')+text.slice(start,start+220)+(text.length>start+220?'…':'');
    return `<a class="guide-search-card snowy-card" href="#/guide?chapter=${E(r.id)}">${snowCard()}<span class="search-chapter-group">${E(r.group)}</span><h3>${E(r.title)}</h3><p>${E(snippet)}</p><span class="entry-open">Читать главу</span></a>`;
  }
  function departmentResults() {
    const key=state.route;
    let data=key==='guide'?D.instructions:D[key];
    if(key==='guide'&&!state.chapter&&!state.localQuery)data=data.filter(r=>guideInGroup(r,state.guideGroup));
    if(key==='veterans'&&state.peopleView==='warnings')data=data.filter(r=>r.warnings?.trim());
    if(key==='guide'&&state.chapter&&!state.localQuery)data=data.filter(r=>r.id===state.chapter);
    const filtered=C.search(data,state.localQuery);
    $('#department-count').textContent=`${state.localQuery&&key==='guide'?'По всему руководству · ':''}${filtered.length} ${C.plural(filtered.length,key==='guide'?['глава','главы','глав']:['запись','записи','записей'])}`;
    $('#department-results').innerHTML=filtered.length ? key==='guide' ? `<div class="guide-chapters">${filtered.map(chapterHTML).join('')}</div>` : `<div class="people-grid">${filtered.map(r=>personCard(r,key)).join('')}</div>` : empty('Ничего не найдено','Попробуйте другое имя, идентификатор или слово.');
  }
  function guideNavigation() {
    const links=guideTabs.map(t=>`<a class="guide-nav-link ${state.tab!=='leadership'&&state.guideGroup===t.id?'active':''}" href="#/guide?section=${t.id}" ${state.tab!=='leadership'&&state.guideGroup===t.id?'aria-current="page"':''}>${icon(t.icon)}<span>${t.label}</span><small>${D.instructions.filter(r=>guideInGroup(r,t.id)).length}</small></a>`).join('');
    return `<nav class="guide-nav" aria-label="Разделы руководства">${links}<a class="guide-nav-link ${state.tab==='leadership'?'active':''}" href="#/guide?tab=leadership" ${state.tab==='leadership'?'aria-current="page"':''}>${icon('users')}<span>Состав руководства</span></a></nav>`;
  }
  function renderSection() {
    const key=state.route;
    const tabs=key==='guide'?guideNavigation():key==='veterans'?`<div class="topic-tabs people-view-tabs" aria-label="Записи ветеранов"><button class="topic-tab ${state.peopleView==='all'?'active':''}" data-people-view="all" aria-pressed="${state.peopleView==='all'}">Все ветераны<small>${D.veterans.length}</small></button><button class="topic-tab ${state.peopleView==='warnings'?'active':''}" data-people-view="warnings" aria-pressed="${state.peopleView==='warnings'}">С предупреждениями<small>${D.veterans.filter(r=>r.warnings?.trim()).length}</small></button></div>`:'';
    if(key==='guide'&&state.tab==='leadership') {
      $('#view').innerHTML=tabs+`<article class="roster-card snowy-card">${snowCard()}<span class="large-icon">${icon('users')}</span><h2>Реестр администрации</h2><p>Состав и должности ведутся в отдельном реестре, указанном в руководстве отдела.</p>${external(D.departmentSources.guide.rosterUrl,'Открыть реестр администрации','outline-button')}<p class="source-caption">Список сотрудников из этого реестра пока не перенесён на сайт.</p></article>`+sourceBar(key);return;
    }
    const topic=guideTabs.find(t=>t.id===state.guideGroup);
    const context=key==='guide'?`<section class="reading-context"><h2>${state.chapter?'Чтение главы':E(topic?.label||'Инструкции и правила')}</h2><p>${state.chapter?E(D.instructions.find(r=>r.id===state.chapter)?.title):E(topic?.description||'Все главы руководства отдела.')}</p>${state.chapter?'<a class="source-link" href="#/guide?section='+E(state.guideGroup)+'">К разделу руководства</a>':''}</section>`:key==='violators'?archiveNotice():'';
    const extra=key==='guide'?`<div class="guide-source-links">${external(D.departmentSources.guide.attentionUrl,'Важная информация в оригинале')}<a class="source-link" href="#/guide?section=all">Все 28 глав</a></div>`:key==='veterans'?`<p class="maintainer">${E(D.departmentSources.veterans.maintainer)}</p>`:'';
    $('#view').innerHTML=tabs+context+`<div class="department-toolbar"><label class="department-search"><span>${icon('search')}</span><input id="department-search" type="search" value="${E(state.localQuery)}" aria-label="Поиск в разделе" placeholder="${key==='guide'?'Поиск по руководству…':'Ник, Steam ID или Discord…'}"></label><span id="department-count" class="result-count" role="status"></span><button type="button" class="hint-button" data-info="${key==='guide'?'guide':'people'}">${icon('info')}Подсказка</button></div><div id="department-results"></div>`+sourceBar(key)+extra;
    departmentResults();
  }
  function openInfo(kind) {
    const dlg=$('#info-dialog');
    $('#dialog-section').textContent=['usage','filters','source','round'].includes(kind)?'C.A.S.S.I.E.':'СПРАВОЧНИК ОТДЕЛА';
    if(kind==='tabs'){
      $('#dialog-section').textContent='ВКЛАДКИ ДОКУМЕНТА';
      $('#dialog-body').innerHTML='<h2 id="dialog-title">Знакомые метки разделов</h2><p>Значки перенесены из левой панели исходного документа. Цвет обозначает раздел, а статус готовности показывается отдельно на карточке.</p><dl class="help-definitions"><div><dt>🔵 МОГ</dt><dd>Мобильные оперативные группы.</dd></div><div><dt>🟢 ПХ и ВОУС</dt><dd>Повстанцы Хаоса и восстановление содержания.</dd></div><div><dt>🟡 Общий НОУС</dt><dd>Нарушение содержания по классу и числу объектов.</dd></div><div><dt>🔴 НОУС по SCP</dt><dd>Нарушение содержания конкретного объекта.</dd></div></dl><p>У остальных разделов сохранены их исходные значки: предупреждения ❗, приказы ⚜️, протоколы ⚠️ и другие.</p>';
      if(!dlg.open)dlg.showModal();return;
    }
    if(kind==='guide')$('#dialog-body').innerHTML='<h2 id="dialog-title">Как читать руководство</h2><ol><li>Если вы недавно в отделе, начните со вкладки «Новичку».</li><li>Нажмите на название главы, чтобы открыть или свернуть её.</li><li>В содержании выберите нужный пункт — страница перейдёт к нему. На телефоне содержание раскрывается над текстом.</li><li>Поиск проверяет все главы, даже когда выбран отдельный раздел.</li></ol><p>Схемы и иллюстрации можно посмотреть по ссылке «Оригинал главы».</p>';
    else if(kind==='filters'||kind==='round')$('#dialog-body').innerHTML='<h2 id="dialog-title">Кэсси во время раунда</h2><ol><li><strong>Выберите ситуацию.</strong> Все разделы документа вынесены в кнопки: НОУС, ВОУС, побег, запросы, приказы, протоколы и другие.</li><li><strong>Найдите нужный вариант.</strong> В общем НОУС — класс и количество объектов. В других разделах — номер SCP, адресат, действие или протокол.</li><li><strong>Нажмите «Копировать».</strong> Для обычной команды не нужно открывать карточку. Если шагов несколько, копируйте их по порядку и читайте примечания между ними.</li><li>На сервере откройте админ-панель клавишей <strong>M</strong>, затем <strong>Open the Text-Based Remote Admin Console</strong> и вставьте команду.</li></ol><dl class="help-definitions"><div><dt>НОУС</dt><dd>Нарушение особых условий содержания. «Общий НОУС» — по классу и числу объектов, «НОУС по SCP» — для конкретного SCP.</dd></div><div><dt>ВОУС</dt><dd>Восстановление особых условий содержания: варианты сдерживания, ликвидации и эвакуации из документа.</dd></div><div><dt>МОГ / ПХ</dt><dd>Мобильная оперативная группа / Повстанцы Хаоса.</dd></div></dl><p>Поиск проверяет все разделы выбранного каталога. Введите, например, «096» или «САР-3». Значок информации открывает полный текст и источник.</p><p>Статусы взяты из документа. «Заменена», «Требует правок», архив и черновики видны отдельно от готовых команд.</p>';
    else if(kind==='people')$('#dialog-body').innerHTML='<h2 id="dialog-title">Как найти участника</h2><ol><li>Введите ник, Steam ID или Discord в поиск раздела. Можно вводить часть имени или идентификатора.</li><li>Откройте строку со сведениями в карточке: там находятся идентификаторы, даты и данные из таблицы.</li><li>Ссылка «Строка в таблице» ведёт к исходной записи.</li></ol><p>«Не указано» означает пустое поле в источнике. Пометка «Архив» не подтверждает действующие меры.</p>';
    else if(kind==='usage')$('#dialog-body').innerHTML=`<h2 id="dialog-title">Как использовать Кэсси</h2><ol><li>Найдите нужное оповещение по названию, номеру SCP или категории.</li><li>Проверьте статус и примечания. Нажмите «Копировать» прямо у нужного варианта; полный текст открывается по значку информации.</li><li>На игровом сервере откройте админ-панель клавишей <strong>M</strong>, затем <strong>Open the Text-Based Remote Admin Console</strong> и вставьте команду.</li><li>Если команд несколько, выполняйте шаги по порядку и учитывайте указания между ними.</li></ol><p>Для запуска нужны права администратора на игровом сервере.</p><div class="notice">Сайт копирует текст команд. Выполнение происходит в игровой консоли.</div>`;
    else $('#dialog-body').innerHTML=`<h2 id="dialog-title">Источник и статусы</h2><p class="source-title">${E(D.source.title)}</p><p>Автор: <strong>${E(D.source.author)}</strong>. Помощь с C.A.S.S.I.E.: <strong>${E(D.source.helper)}</strong>.</p><p>${D.source.verifiedAt?`Сверено с Google-документом ${E(new Date(D.source.verifiedAt+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}))}. Проверены ${D.source.verification.commandParts} командных частей, примечания и ${D.dictionary.length} слов и фраз.`:'Каталог импортирован из вложенной копии документа.'} Автоматической синхронизации нет.</p><p>${external(D.source.url,'Открыть исходный документ')}</p><p style="margin-top:14px">Текст команд и порядок шагов сохранены. Описание оповещения показано отдельно без игрового оформления.</p><div class="dialog-legend">${Object.values(D.legend).map(s=>`<span class="status ${s.tone}">${E(s.label)}</span>`).join('')}</div><div class="notice">Материалы предназначены для проекта Mandarin · SCP:SL.</div>`;
    if(['round','filters'].includes(kind))$('#dialog-body').innerHTML+='<p>В общем НОУС золотистые карточки обозначают Евклид, красные — Кетер, два цветных края — смешанный вариант. Статус готовности указан отдельно.</p>';
    if(!dlg.open)dlg.showModal();
  }
  function toast(text) { clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,2600); }
  async function copy(text,button) {
    try {
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      toast('Скопировано в буфер обмена');
      if(button?.classList.contains('copy-button')) { const before=button.dataset.copyLabel||button.innerHTML;button.dataset.copyLabel=before;clearTimeout(copyTimers.get(button));button.innerHTML=`${icon('check')}Готово`;copyTimers.set(button,setTimeout(()=>{if(button.isConnected)button.innerHTML=before;},1700)); }
    } catch {
      const dlg=$('#info-dialog');
      $('#dialog-section').textContent='КОПИРОВАНИЕ';
      $('#dialog-body').innerHTML='<h2 id="dialog-title">Скопировать вручную</h2><p>Браузер не разрешил доступ к буферу обмена. Выделенный текст можно скопировать вручную.</p><textarea id="manual-copy" class="manual-copy" readonly aria-label="Текст для копирования"></textarea>';
      $('#manual-copy').value=text;if(!dlg.open)dlg.showModal();$('#manual-copy').focus();$('#manual-copy').select();
    }
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-guide-jump')) {const target=$('#'+b.dataset.guideJump);if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}return;}
    if(b.hasAttribute('data-focus-search')) {const input=$('#department-search');input?.focus({preventScroll:true});input?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
    if(b.hasAttribute('data-people-view')) {state.peopleView=b.dataset.peopleView;syncRoute();renderSection();$(`[data-people-view="${state.peopleView}"]`)?.focus();return;}
    if(b.hasAttribute('data-close-record')||b.hasAttribute('data-back-list')){closeRecord();return;}
    if(b.hasAttribute('data-variant')){state.variant=b.dataset.variant;state.selected=null;state.detailOpen=false;renderCatalog();syncRoute();$(`[data-variant="${state.variant}"]`)?.focus();return;}
    if(b.hasAttribute('data-clear-cassie')){state.cassieQuery='';$('#global-search').value='';renderCatalog();syncRoute();$('#global-search').focus();return;}
    if(b.hasAttribute('data-clear-status')){state.status='all';renderCatalog();syncRoute();return;}
    if(b.hasAttribute('data-record')) {selectRecord(b.dataset.record);return;}
    if(b.hasAttribute('data-copy-part')) {const r=D.records.find(r=>r.id===b.dataset.copyRecord),p=r?.parts[Number(b.dataset.copyPart)];if(p?.type==='command'&&p.complete)copy(p.text,b);return;}
    if(b.hasAttribute('data-copy-word')) {copy(b.dataset.copyWord,b);return;}
    if(b.hasAttribute('data-info')) {openInfo(b.dataset.info);return;}
    if(b.hasAttribute('data-close-dialog')) {$('#info-dialog').close();return;}
    if(b.hasAttribute('data-more-words')) {state.wordLimit+=120;renderWords();return;}
    if(b.hasAttribute('data-category')) {state.category=b.dataset.category;state.shelf='catalog';state.mode='catalog';state.status='all';state.variant='all';state.cassieQuery='';$('#global-search').value='';}
    else if(b.hasAttribute('data-shelf')) {state.shelf=b.dataset.shelf;state.category=state.shelf==='catalog'?'general-breach':'all';state.variant='all';state.mode='catalog';state.status='all';state.cassieQuery='';$('#global-search').value='';}
    else if(b.hasAttribute('data-mode'))state.mode=b.dataset.mode;
    else if(b.hasAttribute('data-search-group'))state.searchGroup=b.dataset.searchGroup;
    else if(b.hasAttribute('data-reset')) {state.query='';state.cassieQuery='';state.variant='all';state.route='cassie';state.category='all';state.shelf='catalog';state.status='all';state.mode='catalog';state.searchGroup='all';$('#global-search').value='';}
    else return;
    const control=['category','shelf','mode','search-group'].find(key=>b.hasAttribute('data-'+key));
    const controlValue=control?b.getAttribute('data-'+control):null;
    state.selected=null;state.detailOpen=false;syncRoute();render();
    if(control)$(`[data-${control}="${controlValue}"]`)?.focus();
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='global-search') {
      clearTimeout(searchTimer);
      searchTimer=setTimeout(()=>{if(state.route==='cassie'){state.cassieQuery=e.target.value.trim();state.variant='all';state.status='all';state.selected=null;state.detailOpen=false;renderCatalog();syncRoute();}else{state.query=e.target.value.trim();state.route=state.query?'search':'home';state.category='all';state.shelf='catalog';state.status='all';state.mode='catalog';state.selected=null;state.detailOpen=false;state.searchGroup='all';syncRoute();render();}},100);
    }
    if(e.target.id==='department-search') {state.localQuery=e.target.value;departmentResults();}
    if(e.target.id==='word-search') {state.wordQuery=e.target.value;state.wordLimit=120;renderWords();}
  });
  document.addEventListener('keydown',e=>{
    const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')||document.activeElement?.isContentEditable;
    if((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')) {e.preventDefault();$(state.route==='cassie'&&state.mode==='dictionary'?'#word-search':'#global-search').focus();}
    if(e.key==='Escape'&&document.activeElement===$('#global-search')&&!$('#info-dialog').open) {e.target.value='';e.target.dispatchEvent(new Event('input',{bubbles:true}));}
  });
  $('#record-dialog').addEventListener('cancel',()=>{state.detailOpen=false;syncRoute();});
  $('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();$('#main').focus();});
  window.addEventListener('hashchange',()=>{clearTimeout(searchTimer);readRoute();window.scrollTo?.({top:0,behavior:'instant'});});
  fillIcons();readRoute();
})();
