(()=>{
  'use strict';
  const protectedPage=!!document.querySelector('[data-protected-page]');
  const accessPage=!!document.querySelector('[data-access-page]');
  let csrf='',busy=false;
  const message=text=>document.querySelectorAll('[data-access-message]').forEach(el=>{el.textContent=text;});
  function closePage(){
    // This clears the open view; the server independently guards every protected file.
    document.body.replaceChildren();
    window.location.replace('/access');
  }
  async function check(){
    if(busy||document.visibilityState==='hidden')return;
    busy=true;
    try{
      const response=await fetch('/api/session',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok){
        if(protectedPage)closePage();
        else message(response.status===503?'Проверка временно недоступна. Попробуем ещё раз.':'');
        return;
      }
      const user=await response.json();csrf=user.csrf;
      if(protectedPage&&user.status!=='approved')return closePage();
      if(accessPage&&user.status==='approved')window.location.replace('/');
    }catch{if(protectedPage)closePage();else message('Не удалось связаться с сайтом. Проверим соединение ещё раз.');}
    finally{busy=false;}
  }
  document.querySelectorAll('[data-logout]').forEach(button=>button.addEventListener('click',async()=>{
    button.disabled=true;
    try{
      if(!csrf){
        const session=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'});
        if(!session.ok){window.location.replace('/access');return;}
        csrf=(await session.json()).csrf;
      }
      const result=await fetch('/api/logout',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':csrf}});
      if(result.ok||result.status===401){window.location.replace('/access');return;}
      message('Не удалось выйти. Обнови страницу и попробуй ещё раз.');
    }catch{message('Проверь соединение и повтори выход.');}
    finally{button.disabled=false;}
  }));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
  window.addEventListener('pageshow',event=>{if(event.persisted)check();});
  check();setInterval(check,30000);
})();

