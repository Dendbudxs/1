(()=>{
  'use strict';
  const $=selector=>document.querySelector(selector);
  const body=$('[data-table-body]'),head=$('[data-table-head]'),message=$('[data-admin-message]');
  const refresh=$('[data-refresh]'),form=$('[data-add-email]'),search=$('#admin-search');
  const previous=$('[data-previous]'),next=$('[data-next]'),dialog=$('[data-confirm]');
  const statusNames={approved:'Разрешён',pending:'Ожидает',blocked:'Отозван'};
  const events={login:'Вход',logout:'Выход',email_allowed:'Почта добавлена',access_approved:'Доступ одобрен',access_blocked:'Доступ отозван',access_denied:'Отказ в доступе'};
  const reasons={approved:'Допуск подтверждён',pending_approval:'Ожидает одобрения',blocked:'Доступ отозван',account_mismatch:'Другой Google-аккаунт'};
  const notes={grants:'Если почта ещё не привязана к аккаунту, сотруднику нужно войти через Google. Письма автоматически не отправляются.',requests:'Перед одобрением убедись, что знаешь сотрудника. Для почты другого провайдера дополнительно сверь код аккаунта с ним лично.',audit:'Записи хранятся 30 дней. Журнал не отслеживает копирование текста и снимки экрана.'};
  let tab='grants',offset=0,csrf='',ownerEmail='',sequence=0,timer,controller;
  const cell=text=>{const el=document.createElement('td');el.textContent=text??'—';return el;};
  const small=(parent,text,attention=false)=>{const el=document.createElement('small');el.textContent=text;if(attention)el.className='attention';parent.append(el);};
  const date=value=>value?new Date(value).toLocaleString('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'Ещё не входил';
  const errorText=reason=>({invalid_email:'Проверь адрес почты.',owner_protected:'Доступ владельца нельзя изменить здесь.',account_mismatch:'Эта почта привязана к другому Google-аккаунту. Автоматически заменить его нельзя.',rate_limited:'Слишком много действий. Повтори через минуту.',csrf_failed:'Обнови страницу и повтори действие.'}[reason]||'Не удалось выполнить действие. Обнови страницу и попробуй снова.');
  function empty(text){const tr=document.createElement('tr'),td=cell(text);td.colSpan=4;td.className='admin-empty';tr.append(td);body.append(tr);}
  function confirmBlock(email){
    if(dialog.open)return Promise.resolve(false);
    $('[data-confirm-email]').textContent=email;dialog.returnValue='';dialog.showModal();
    return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true}));
  }
  function actionButton(parent,label,endpoint,action,email){
    const button=document.createElement('button');button.type='button';button.className=action==='approve'?'auth-primary':'auth-secondary';button.textContent=label;button.setAttribute('aria-label',label+': '+email);
    button.addEventListener('click',async()=>{
      if(action==='block'&&!await confirmBlock(email))return;
      button.disabled=true;
      try{
        await post(endpoint,{action});
        if(await load())message.textContent=action==='block'?'Доступ отозван. Все сессии аккаунта закрыты.':'Доступ разрешён.';
      }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
    });parent.append(button);
  }
  async function post(endpoint,payload){
    const result=await fetch(endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(payload)});
    if(!result.ok){let data;try{data=await result.json();}catch{}throw Error(errorText(data?.error));}
    return result.json();
  }
  function render(data){
    head.replaceChildren();body.replaceChildren();
    for(const key of ['approved','pending','blocked'])$('[data-stat="'+key+'"]').textContent=data.counts[key];
    $('[data-request-count]').textContent=data.counts.pending;
    const headers=tab==='grants'?['Сотрудник / почта','Допуск','Последний вход','Действия']:tab==='requests'?['Сотрудник','Заявка','Последний вход','Решение']:['Когда','Событие','Кто','Участник / причина'];
    const heading=document.createElement('tr');for(const title of headers){const th=document.createElement('th');th.scope='col';th.textContent=title;heading.append(th);}head.append(heading);
    for(const item of data.rows){
      const tr=document.createElement('tr');
      if(tab==='audit'){
        tr.append(cell(date(item.at)),cell(events[item.event]||item.event),cell(item.actor),cell([item.target,reasons[item.reason]||item.reason].filter(Boolean).join(' · ')||'—'));
      }else{
        const person=cell(''),email=document.createElement('strong');email.textContent=item.email;person.append(email);
        if(item.name)small(person,item.name);
        if(tab==='requests'&&!item.authoritative){small(person,'Код аккаунта: '+item.sub);small(person,'Почта другого сервиса — уточни аккаунт у сотрудника.',true);}
        if(tab==='grants'&&!item.sub)small(person,'Ожидает первого входа Google');
        const state=cell(''),badge=document.createElement('span');badge.className='admin-status admin-status-'+item.status;badge.textContent=statusNames[item.status];state.append(badge);
        const actions=cell('');
        if(item.email===ownerEmail)actions.textContent='Владелец';
        else if(tab==='grants')actionButton(actions,item.status==='blocked'?'Вернуть':'Отозвать','/api/admin/grants/'+item.id,item.status==='blocked'?'approve':'block',item.email);
        else{
          actionButton(actions,'Одобрить','/api/admin/users/'+encodeURIComponent(item.sub),'approve',item.email);
          actionButton(actions,'Отклонить','/api/admin/users/'+encodeURIComponent(item.sub),'block',item.email);
        }
        tr.append(person,state,cell(date(item.last_login)),actions);
      }
      body.append(tr);
    }
    if(!data.rows.length)empty(search.value.trim()?'По этой почте ничего не найдено.':tab==='requests'?'Заявок пока нет. Новые сотрудники появятся здесь после входа.':tab==='audit'?'Событий пока нет.':'Добавь почту сотрудника в форме выше.');
    $('[data-page-status]').textContent=data.total?`${data.offset+1}–${data.offset+data.rows.length} из ${data.total}`:'Нет записей';
    previous.disabled=offset===0;next.disabled=offset+data.limit>=data.total;
    $('[data-tab-note]').textContent=notes[tab];
  }
  async function load(){
    const current=++sequence;controller?.abort();controller=new AbortController();refresh.disabled=true;
    try{
      if(!csrf){
        const session=await fetch('/api/session',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
        if(!session.ok)throw Error('Войди снова, чтобы открыть управление доступом.');
        const user=await session.json();if(!user.isOwner)throw Error('Управление доступно только владельцу.');
        csrf=user.csrf;ownerEmail=user.email;
      }
      const query=new URLSearchParams({tab,offset:String(offset),q:search.value.trim()});
      const response=await fetch('/api/admin?'+query,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('Не удалось загрузить данные. Проверь доступ и повтори попытку.');
      const data=await response.json();if(current!==sequence)return false;
      if(data.total>0&&offset>=data.total){offset=Math.floor((data.total-1)/25)*25;return load();}
      render(data);message.textContent='';return true;
    }catch(error){if(error.name!=='AbortError'&&current===sequence)message.textContent=error.message;return false;}
    finally{if(current===sequence){refresh.disabled=false;form.querySelector('button').disabled=!csrf;}}
  }
  const tabs=[...document.querySelectorAll('[data-tab]')];
  function selectTab(button){
    tab=button.dataset.tab;offset=0;
    for(const entry of tabs){const active=entry===button;entry.setAttribute('aria-selected',String(active));entry.tabIndex=active?0:-1;}
    $('#admin-table-panel').setAttribute('aria-labelledby',button.id);return load();
  }
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>selectTab(button));
    button.addEventListener('keydown',event=>{
      let target;if(event.key==='ArrowRight')target=(index+1)%tabs.length;else if(event.key==='ArrowLeft')target=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')target=0;else if(event.key==='End')target=tabs.length-1;
      if(target!==undefined){event.preventDefault();tabs[target].focus();selectTab(tabs[target]);}
    });
  });
  form.querySelector('button').disabled=true;
  form.addEventListener('submit',async event=>{
    event.preventDefault();const button=form.querySelector('button');button.disabled=true;
    try{
      await post('/api/admin/emails',{email:form.elements.email.value});form.reset();search.value='';
      if(await selectTab(tabs[0]))message.textContent='Почта добавлена. Сотрудник может войти через Google.';
    }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
  });
  search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{offset=0;load();},250);});
  refresh.addEventListener('click',load);previous.addEventListener('click',()=>{offset=Math.max(0,offset-25);load();});next.addEventListener('click',()=>{offset+=25;load();});load();
})();
