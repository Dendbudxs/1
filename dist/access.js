(function(){
  'use strict';
  const dialog=document.getElementById('admin-dialog'),content=document.getElementById('access-content'),open=document.getElementById('admin-open');
  if(!dialog||!content||!open)return;
  const escape=window.MRP.escape;
  const managed=document.body.dataset.accessServer==='true';
  const roleNames={owner:'Владелец',admin:'Администратор',member:'Читатель'};
  const eventNames={owner_created:'Создан владелец',login:'Вход',access_created:'Выдан доступ',access_blocked:'Доступ закрыт',access_restored:'Доступ возвращён',role_admin:'Назначен администратор',role_member:'Назначен читатель',password_reset:'Сброшен пароль',password_changed:'Пароль изменён'};
  let identity=null,users=[],audit=[],query='',filter='all',tab='users',busy=false,credentials=null;
  const date=value=>value?new Date(value).toLocaleString('ru-RU',{dateStyle:'short',timeStyle:'short'}):'Ещё не входил';
  async function api(path,body){
    const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':identity?.csrf||''},body:JSON.stringify(body)})});
    let value;try{value=await response.json();}catch{throw Error('Сервер управления доступом недоступен.');}
    if(response.status===401){location.replace('/login');throw Error('Сессия завершена.');}
    if(response.status===428){location.replace('/account/password');throw Error('Нужна смена пароля.');}
    if(!response.ok)throw Error(value.message||'Действие не выполнено.');return value;
  }
  async function getSession(){identity=await api('/api/session');if(identity.user.mustChange){location.replace('/account/password');return false;}open.textContent=['owner','admin'].includes(identity.user.role)?'Администратор':'Аккаунт';return true;}
  function message(text,isError=true){let box=document.getElementById('access-message');if(!box){box=document.createElement('p');box.id='access-message';content.prepend(box);}box.className=isError?'access-error':'access-success';box.textContent=text;box.setAttribute('role',isError?'alert':'status');box.hidden=false;}
  function canManage(u){return u.role!=='owner'&&u.id!==identity.user.id&&(identity.user.role==='owner'||u.role==='member');}
  function userRow(u){
    const can=canManage(u);
    return `<article class="access-user"><div class="access-user-main"><h3>${escape(u.name)}</h3><span class="access-email">${escape(u.email)}</span><div class="access-user-tags"><span class="access-role">${roleNames[u.role]}</span><span class="access-status ${u.status==='blocked'?'blocked':''}">${u.status==='approved'?'Доступ разрешён':'Доступ закрыт'}</span>${u.mustChange?'<span class="access-muted">Пароль временный</span>':''}</div><span class="access-last">Последний вход: ${date(u.lastLogin)}</span></div><div class="access-user-actions">${can?`<button type="button" data-access-action="${u.status==='approved'?'block':'restore'}" data-user="${escape(u.id)}" class="${u.status==='approved'?'access-danger':'access-secondary'}">${u.status==='approved'?'Закрыть доступ':'Вернуть доступ'}</button><button type="button" data-access-action="reset" data-user="${escape(u.id)}" class="access-link">Сбросить пароль</button>${identity.user.role==='owner'?`<button type="button" data-access-action="role" data-user="${escape(u.id)}" class="access-link">${u.role==='admin'?'Сделать читателем':'Назначить администратором'}</button>`:''}`:`<span class="access-protected">${u.role==='owner'?'Доступ владельца защищён':u.id===identity.user.id?'Ваша учётная запись':'Управляет владелец'}</span>`}</div></article>`;
  }
  function rows(){
    const q=query.trim().toLocaleLowerCase('ru');
    const visible=users.filter(u=>(filter==='all'||u.status===filter)&&(!q||(u.email+' '+u.name).toLocaleLowerCase('ru').includes(q)));
    document.getElementById('access-user-list').innerHTML=visible.map(userRow).join('')||'<p class="access-empty">Пользователи не найдены.</p>';
    document.getElementById('access-user-count').textContent=`${visible.length} из ${users.length}`;
    content.querySelectorAll('[data-access-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.accessFilter===filter)));
  }
  function render(){
    const me=identity.user,isAdmin=['owner','admin'].includes(me.role);
    content.innerHTML=`<p class="access-account"><span><strong>${escape(me.name)}</strong><span>${escape(me.email)} · ${roleNames[me.role]}</span></span><span class="access-account-actions"><a href="/account/password">Сменить пароль</a><button type="button" data-access-logout class="access-link">Выйти</button></span></p><div id="access-message" role="status" hidden></div>${isAdmin?`<nav class="access-tabs" aria-label="Разделы администрирования"><button data-access-tab="users" aria-pressed="${tab==='users'}">Пользователи <span>${users.length}</span></button><button data-access-tab="audit" aria-pressed="${tab==='audit'}">Журнал действий</button></nav>${tab==='users'?`<details class="access-add"><summary>Выдать доступ пользователю</summary><p>Почта используется как логин. После добавления появится временный пароль для первого входа; письмо не отправляется.</p><form id="access-add-form"><div class="access-form-grid"><label>Имя / позывной<input name="name" required maxlength="80" autocomplete="off" placeholder="Позывной сотрудника"></label><label>Почта<input name="email" type="email" required maxlength="254" autocomplete="off" placeholder="name@example.com"></label>${me.role==='owner'?'<label>Роль<select name="role"><option value="member">Читатель — материалы отдела</option><option value="admin">Администратор — управление доступом</option></select></label>':''}</div><button type="submit" class="access-primary">Выдать доступ</button></form></details><div class="access-list-tools"><label class="access-search"><span class="access-visually-hidden">Поиск по имени или почте</span><input id="access-search" type="search" placeholder="Имя или почта…" value="${escape(query)}"></label><div class="access-filters"><button data-access-filter="all" aria-pressed="${filter==='all'}">Все</button><button data-access-filter="approved" aria-pressed="${filter==='approved'}">С доступом</button><button data-access-filter="blocked" aria-pressed="${filter==='blocked'}">Закрыт</button></div><span id="access-user-count" class="access-muted"></span><button type="button" data-access-refresh class="access-link">Обновить</button></div><div id="access-user-list"></div>`:`<p class="access-muted">Последние 50 действий. Время показано в часовом поясе вашего устройства.</p><div class="access-audit">${audit.map(a=>`<article><time>${date(a.at)}</time><div><strong>${eventNames[a.event]||'Изменение доступа'}</strong><span>${escape(a.target)}</span><small>${escape(a.actor)}</small></div></article>`).join('')||'<p class="access-empty">Действий пока нет.</p>'}</div>`}`:'<p class="access-note">Ваша учётная запись открывает материалы отдела. Для изменения допуска обратитесь к администрации.</p>'}<div id="access-credentials"></div>`;
    if(isAdmin&&tab==='users')rows();
    if(credentials){
      document.getElementById('access-credentials').innerHTML=`<section class="access-secret" aria-labelledby="access-secret-title"><h3 id="access-secret-title">Данные первого входа</h3><p>Логин: <strong>${escape(credentials.user.email)}</strong></p><p>Пароль показан только сейчас. Скопируйте его перед закрытием окна и передайте сотруднику. При первом входе он задаст собственный пароль.</p><label>Временный пароль<input id="access-temp-password" type="text" readonly autocomplete="off"></label><div><button type="button" data-access-copy class="access-primary">Скопировать пароль</button><button type="button" data-access-dismiss class="access-link">Данные сохранены</button></div><small>Действует до ${date(credentials.expires)}. Новый сброс пароля отменяет прежний.</small></section>`;
      document.getElementById('access-temp-password').value=credentials.temporaryPassword;
      document.getElementById('access-credentials').scrollIntoView({block:'nearest'});
    }
  }
  async function load(){
    if(!await getSession())return;
    if(['owner','admin'].includes(identity.user.role)){const result=await api('/api/admin/users');users=result.users;audit=result.audit;}
    render();
  }
  function unavailable(){
    content.innerHTML='<div class="access-note"><h3>Доступ к этой публикации задаётся в ChatGPT Sites</h3><p>Допуски к текущему сайту выдаются и отзываются в настройках публикации. Эта страница не может менять настройки платформы.</p></div><div class="access-hosting-note"><h3>Панель для вашего хостинга готова</h3><p>В серверной версии из архива доступны вход, пользователи, роли, блокировка, возврат доступа и журнал. После установки и создания владельца они появятся в этом окне автоматически.</p><p class="access-muted">Инструкция по запуску находится в архиве: DEPLOY.md. Первоначальный владелец — amurtigered@gmail.com; пароль задаётся при установке.</p></div>';
  }
  async function show(){
    if(!dialog.open)dialog.showModal();
    if(!managed){unavailable();return;}
    content.innerHTML='<p class="access-loading" role="status">Загружаю доступы…</p>';
    try{await load();}catch(e){content.innerHTML='<button type="button" data-access-refresh class="access-secondary">Повторить загрузку</button>';message(e.message);}
  }
  open.addEventListener('click',show);
  document.getElementById('admin-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{credentials=null;content.innerHTML='';open.focus();});
  content.addEventListener('input',event=>{if(event.target.id==='access-search'){query=event.target.value;rows();}});
  content.addEventListener('submit',async event=>{
    if(event.target.id!=='access-add-form')return;event.preventDefault();if(busy)return;busy=true;
    const form=event.target,button=form.querySelector('button[type=submit]');button.disabled=true;
    try{
      const b=Object.fromEntries(new FormData(form));
      const result=await api('/api/admin/create',{name:b.name,email:b.email,role:b.role||'member'});
      credentials=result;tab='users';
      users.push(result.user);render();message('Доступ выдан. Сохраните данные первого входа.',false);
      // The write has succeeded; a later read error must never invite a duplicate write.
      try{const fresh=await api('/api/admin/users');users=fresh.users;audit=fresh.audit;render();}catch{message('Доступ выдан. Список не обновился; пароль ниже сохранён.',false);}
    }catch(e){message(e.message);}finally{busy=false;if(button.isConnected)button.disabled=false;}
  });
  content.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button||busy)return;
    if(button.hasAttribute('data-access-tab')){tab=button.dataset.accessTab;render();return;}
    if(button.hasAttribute('data-access-filter')){filter=button.dataset.accessFilter;rows();return;}
    if(button.hasAttribute('data-access-dismiss')){credentials=null;render();return;}
    if(button.hasAttribute('data-access-copy')){
      try{await navigator.clipboard.writeText(credentials.temporaryPassword);button.textContent='Скопировано';}catch{const input=document.getElementById('access-temp-password');input.focus();input.select();message('Выделенный пароль можно скопировать вручную.',false);}return;
    }
    if(button.hasAttribute('data-access-refresh')){try{await load();}catch(e){message(e.message);}return;}
    busy=true;button.disabled=true;
    try{
      if(button.hasAttribute('data-access-logout')){await api('/api/logout',{});location.replace('/login');return;}
      if(!button.hasAttribute('data-access-action'))return;
      const target=users.find(u=>u.id===button.dataset.user);if(!target||!canManage(target))return;
      const action=button.dataset.accessAction;
      const text={block:'Закрыть доступ и завершить все сессии',restore:'Вернуть доступ',reset:'Сбросить пароль и завершить все сессии',role:target.role==='admin'?'Снять права администратора':'Дать права администратора'}[action];
      if(!text||!window.confirm(`${text} для ${target.name} (${target.email})?`))return;
      const result=await api('/api/admin/change',{id:target.id,action,...(action==='role'?{role:target.role==='admin'?'member':'admin'}:{})});
      users=users.map(u=>u.id===result.user.id?result.user:u);
      if(result.temporaryPassword)credentials=result;
      render();message('Изменение сохранено.',false);
      try{const fresh=await api('/api/admin/users');users=fresh.users;audit=fresh.audit;render();}catch{message('Изменение сохранено. Обновить журнал сейчас не удалось.',false);}
    }catch(e){message(e.message);}finally{busy=false;if(button.isConnected)button.disabled=false;}
  });
  if(managed){
    getSession().then(ok=>{if(ok&&location.pathname==='/admin')show();}).catch(()=>{});
    setInterval(()=>{if(!document.hidden)getSession().catch(()=>{});},30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)getSession().catch(()=>{});});
  }
})();
