(function(){
  'use strict';
  const form=document.getElementById('login-form'),error=document.getElementById('login-error');
  if(!form)return;
  let csrf='',busy=false;
  async function call(path,body){
    const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{})},body:JSON.stringify(body)});
    let result;try{result=await response.json();}catch{throw Error('Сервер недоступен. Повторите позже.');}
    if(!response.ok)throw Error(result.message||'Не удалось выполнить действие.');return result;
  }
  function showError(message){error.textContent=message;error.hidden=false;}
  async function session(){const r=await fetch('/api/session',{cache:'no-store',credentials:'same-origin'});if(!r.ok){location.replace('/login');return false;}const data=await r.json();csrf=data.csrf;return true;}
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;busy=true;error.hidden=true;
    const button=form.querySelector('button[type=submit]');button.disabled=true;
    try{
      const fields=Object.fromEntries(new FormData(form));
      if(form.dataset.flow==='password'){
        if(fields.newPassword!==fields.confirmPassword)throw Error('Новые пароли не совпадают.');
        if(!await session())return;
        await call('/api/password',{currentPassword:fields.currentPassword,newPassword:fields.newPassword});location.replace('/');
      }else{const result=await call('/api/login',{email:fields.email,password:fields.password});location.replace(result.redirect==='/account/password'?result.redirect:'/');}
    }catch(e){showError(e.message||'Проверьте соединение и повторите вход.');}
    finally{busy=false;button.disabled=false;}
  });
  document.getElementById('gate-logout')?.addEventListener('click',async()=>{try{if(await session()){await call('/api/logout',{});location.replace('/login');}}catch(e){showError(e.message);}});
  // A cross-site bookmark may omit a Strict cookie on its first navigation.
  // Reuse an existing session through a same-origin request before asking for a password.
  if(form.dataset.flow==='login')fetch('/api/session',{cache:'no-store',credentials:'same-origin'}).then(async response=>{if(!response.ok)return;const info=await response.json();if(info.user)location.replace(info.user.mustChange?'/account/password':'/');}).catch(()=>{});
})();
