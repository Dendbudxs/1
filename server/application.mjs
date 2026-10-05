import { readdirSync,readFileSync,lstatSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { openStore,passwordHash,passwordMatches,validPassword,emailOf,secret,equal } from './access-store.mjs';

class HttpError extends Error {constructor(message,status=400){super(message);this.status=status;}}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'};
export function createApplication(config,{siteDir=resolve('dist'),dbPath=config.dbPath,now=Date.now}={}){
  const store=openStore(config,{dbPath,now}),{db,tx,audit,publicUser}=store;
  const cookieName=config.secure?'__Host-mrp-session':'mrp-session';
  const files=new Map();
  function load(dir,prefix=''){
    for(const name of readdirSync(dir)){if(name.startsWith('.'))continue;const info=lstatSync(join(dir,name),{throwIfNoEntry:false});if(!info||info.isSymbolicLink())continue;
      if(info.isDirectory())load(join(dir,name),prefix+name+'/');
      else if(info.isFile()){const extension=name.slice(name.lastIndexOf('.'));if(mime[extension])files.set('/'+prefix+name,{body:readFileSync(join(dir,name)),type:mime[extension]});}
    }
  }
  load(siteDir);
  const publicFiles=new Set(['/access.css','/login.js','/assets/mandarin-brand.png']);
  const dummy=passwordHash(randomBytes(24).toString('base64url'));
  const attempts=new Map();let inFlight=0;
  function limited(key){
    const at=now();for(const [k,b] of attempts)if(b.until<=at)attempts.delete(k);
    if(attempts.size>5000)throw new HttpError('Слишком много попыток. Повторите через минуту.',429);
    const b=attempts.get(key)||{count:0,until:at+60000};attempts.set(key,b);
    if(++b.count>8)throw new HttpError('Слишком много попыток входа. Повторите через минуту.',429);
  }
  function response(body,status=200,type='text/html',headers={}){
    const h=new Headers({'Content-Type':type+(type.startsWith('image/')?'':'; charset=utf-8'),'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",...headers});
    if(config.secure)h.set('Strict-Transport-Security','max-age=31536000');
    return new Response(body,{status,headers:h});
  }
  const json=(body,status=200,headers={})=>response(JSON.stringify(body),status,'application/json',headers);
  const redirect=path=>response('',303,'text/html',{Location:path});
  const cookie=(token,seconds=7*86400)=>cookieName+'='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+seconds+(config.secure?'; Secure':'');
  function token(request){
    const values=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(cookieName+'='));
    return values.length===1?values[0].slice(cookieName.length+1):'';
  }
  function requireUser(request,{admin=false,owner=false,passwordChange=false}={}){
    const user=store.session(token(request));
    if(!user)throw new HttpError('Войдите в сайт заново.',401);
    if(user.must_change&&!passwordChange)throw new HttpError('Сначала смените временный пароль.',428);
    if(admin&&!['owner','admin'].includes(user.role)||owner&&user.role!=='owner')throw new HttpError('У вас нет прав на это действие.',403);
    return user;
  }
  async function bodyOf(request,user){
    if(request.headers.get('origin')!==config.origin)throw new HttpError('Откройте форму на этом сайте.',403);
    if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw new HttpError('Нужен JSON-запрос.',415);
    if(user&&!equal(request.headers.get('x-csrf-token'),user.csrf))throw new HttpError('Обновите окно и повторите действие.',403);
    if(Number(request.headers.get('content-length')||0)>8192)throw new HttpError('Слишком большой запрос.',413);
    const reader=request.body?.getReader();let size=0;const chunks=[];
    if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new HttpError('Слишком большой запрос.',413);}chunks.push(Buffer.from(value));}}
    let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError('Проверьте поля формы.');}
    if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpError('Проверьте поля формы.');
    return body;
  }
  function loginPage(change=false){
    return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${change?'Смена пароля':'Вход'} · Mandarin Medium RP</title><link rel="icon" href="/assets/mandarin-brand.png"><link rel="stylesheet" href="/access.css"><script src="/login.js" defer></script></head><body class="access-gate"><main class="login-card"><a href="/" class="login-brand"><img src="/assets/mandarin-brand.png" width="60" height="60" alt=""><span>Мандариновый Комплекс<small>MEDIUM RP</small></span></a><span class="access-eyebrow">ЗАКРЫТЫЙ СПРАВОЧНИК ОТДЕЛА</span><h1>${change?'Смените временный пароль':'Добро пожаловать'}</h1><p>${change?'Выберите свой пароль перед открытием материалов.':'Войдите с учётной записью, выданной администрацией.'}</p><form id="login-form" data-flow="${change?'password':'login'}">${change?'':`<label>Почта<input type="email" name="email" required maxlength="254" autocomplete="username" autofocus></label>`}<label>${change?'Текущий пароль':'Пароль'}<input type="password" name="${change?'currentPassword':'password'}" required maxlength="256" autocomplete="${change?'current-password':'current-password'}" ${change?'autofocus':''}></label>${change?'<label>Новый пароль<input type="password" name="newPassword" required minlength="12" maxlength="256" autocomplete="new-password"></label><label>Повторите новый пароль<input type="password" name="confirmPassword" required minlength="12" maxlength="256" autocomplete="new-password"></label><p class="access-muted">Минимум 12 символов. Можно использовать длинную фразу.</p>':''}<p id="login-error" class="access-error" role="alert" hidden></p><button type="submit" class="access-primary">${change?'Сохранить и открыть сайт':'Войти'}</button></form><p class="login-help">${change?'После смены пароля прежние сессии будут закрыты.':'Нужен доступ или забыли пароль? Обратитесь к администрации отдела.'}</p>${change?'<button id="gate-logout" class="access-link" type="button">Выйти из учётной записи</button>':''}</main></body></html>`;
  }
  function targetFor(actor,id){
    if(typeof id!=='string'||id.length>100)throw new HttpError('Пользователь не найден.',404);
    const target=store.user(id);if(!target)throw new HttpError('Пользователь не найден.',404);
    if(target.role==='owner'||target.email===config.ownerEmail)throw new HttpError('Доступ владельца защищён.',403);
    if(target.id===actor.id)throw new HttpError('Нельзя изменить собственный доступ здесь.',403);
    if(actor.role!=='owner'&&target.role==='admin')throw new HttpError('Изменять другого администратора может только владелец.',403);
    return target;
  }
  async function handle(request,{ip='local'}={}){
    try{
      const url=new URL(request.url),path=url.pathname;
      if(url.origin!==config.origin)throw new HttpError('Неверный адрес сайта.',400);
      if(!['GET','HEAD','POST'].includes(request.method))return json({message:'Метод не поддерживается.'},405,{Allow:'GET, HEAD, POST'});
      if(request.method==='GET'||request.method==='HEAD'){
        if(path==='/healthz')return json({ok:true});
        if(path==='/api/session'){
          const u=requireUser(request,{passwordChange:true});return json({enabled:true,user:publicUser(u),csrf:u.csrf});
        }
        if(path==='/login')return response(loginPage());
        if(publicFiles.has(path)&&files.has(path)){const f=files.get(path);return response(request.method==='HEAD'?null:f.body,200,f.type);}
        if(path==='/account/password'){requireUser(request,{passwordChange:true});return response(loginPage(true));}
        if(path==='/api/admin/users'){
          requireUser(request,{admin:true});
          const users=db.prepare('SELECT * FROM access_users ORDER BY CASE role WHEN \'owner\' THEN 0 WHEN \'admin\' THEN 1 ELSE 2 END,email').all().map(publicUser);
          return json({users,audit:db.prepare('SELECT at,event,actor,target FROM access_audit ORDER BY id DESC LIMIT 50').all()});
        }
        const u=store.session(token(request));
        if(!u){if(['/', '/index.html','/admin'].includes(path))return redirect('/login');throw new HttpError('Войдите в сайт.',401);}
        if(u.must_change){if(['/', '/index.html','/admin'].includes(path))return redirect('/account/password');throw new HttpError('Сначала смените временный пароль.',428);}
        if(path==='/admin')requireUser(request,{admin:true});
        const file=files.get(path==='/'||path==='/admin'?'/index.html':path);
        if(!file)throw new HttpError('Страница не найдена.',404);
        const payload=file.type==='text/html'?Buffer.from(file.body.toString().replace('<body>','<body data-access-server="true">')):file.body;
        return response(request.method==='HEAD'?null:payload,200,file.type);
      }
      if(path==='/api/login'){
        limited('ip:'+ip);
        const b=await bodyOf(request),email=emailOf(b.email);
        if(!email||typeof b.password!=='string'||Buffer.byteLength(b.password)>256)throw new HttpError('Неверная почта или пароль.',401);
        limited('account:'+email);
        if(inFlight>=4)throw new HttpError('Сервер занят. Повторите через минуту.',429);
        inFlight++;let matched,u;
        try{u=db.prepare('SELECT * FROM access_users WHERE email=?').get(email);matched=await passwordMatches(b.password,u?.password_hash||await dummy);}finally{inFlight--;}
        if(!matched||!u||u.status!=='approved'||u.temporary_expires&&u.temporary_expires<=now())throw new HttpError('Неверная почта или пароль.',401);
        // A concurrent revoke/reset while scrypt ran must not mint a session.
        const fresh=store.user(u.id);
        if(fresh.status!=='approved'||fresh.password_hash!==u.password_hash)throw new HttpError('Неверная почта или пароль.',401);
        const s=tx(()=>{db.prepare('UPDATE access_users SET last_login=? WHERE id=?').run(now(),u.id);audit('login',u.email,u.email);return store.createSession(fresh);});
        return json({ok:true,redirect:fresh.must_change?'/account/password':'/'},200,{'Set-Cookie':cookie(s.token)});
      }
      const actor=requireUser(request,{passwordChange:path==='/api/password'||path==='/api/logout',admin:path.startsWith('/api/admin/')});
      const b=await bodyOf(request,actor);
      if(path==='/api/logout'){
        db.prepare('DELETE FROM access_sessions WHERE token_hash=?').run(actor.token_hash);return json({ok:true},200,{'Set-Cookie':cookie('',0)});
      }
      if(path==='/api/password'){
        limited('password:'+actor.id);
        if(!validPassword(b.newPassword))throw new HttpError('Новый пароль должен содержать минимум 12 символов и не более 256 байт.');
        if(b.newPassword===b.currentPassword)throw new HttpError('Новый пароль должен отличаться от текущего.');
        if(!await passwordMatches(b.currentPassword,actor.password_hash))throw new HttpError('Текущий пароль неверен.',400);
        const encoded=await passwordHash(b.newPassword);
        const current=store.session(token(request));if(!current||current.password_hash!==actor.password_hash)throw new HttpError('Войдите заново.',401);
        const session=tx(()=>{db.prepare('UPDATE access_users SET password_hash=?,must_change=0,temporary_expires=NULL WHERE id=?').run(encoded,actor.id);db.prepare('DELETE FROM access_sessions WHERE user_id=?').run(actor.id);audit('password_changed',actor.email,actor.email);return store.createSession(store.user(actor.id));});
        return json({ok:true,redirect:'/'},200,{'Set-Cookie':cookie(session.token)});
      }
      if(path==='/api/admin/create'){
        const email=emailOf(b.email),name=typeof b.name==='string'?b.name.trim():'';
        const role=b.role||'member';
        if(!email||!name||name.length>80||!['member','admin'].includes(role))throw new HttpError('Проверьте почту, имя и роль.');
        if(role==='admin'&&actor.role!=='owner')throw new HttpError('Назначать администратора может только владелец.',403);
        if(db.prepare('SELECT id FROM access_users WHERE email=?').get(email))throw new HttpError('Эта почта уже есть в списке. Используйте возврат доступа или сброс пароля.',409);
        const temporaryPassword=randomBytes(18).toString('base64url'),encoded=await passwordHash(temporaryPassword),id=secret();
        requireUser(request,{admin:true});
        tx(()=>{db.prepare('INSERT INTO access_users(id,email,name,role,status,password_hash,must_change,temporary_expires,created) VALUES(?,?,?,?,?,?,?,?,?)').run(id,email,name,role,'approved',encoded,1,now()+7*86400000,now());audit('access_created',actor.email,email);});
        return json({ok:true,user:publicUser(store.user(id)),temporaryPassword,expires:now()+7*86400000},201);
      }
      if(path==='/api/admin/change'){
        const target=targetFor(actor,b.id);
        if(!['block','restore','role','reset'].includes(b.action))throw new HttpError('Действие не поддерживается.');
        if(b.action==='role'){
          if(actor.role!=='owner'||!['member','admin'].includes(b.role))throw new HttpError('Назначать администратора может только владелец.',403);
          tx(()=>{db.prepare('UPDATE access_users SET role=? WHERE id=?').run(b.role,target.id);db.prepare('DELETE FROM access_sessions WHERE user_id=?').run(target.id);audit('role_'+b.role,actor.email,target.email);});
        }else if(b.action==='reset'){
          const temporaryPassword=randomBytes(18).toString('base64url'),encoded=await passwordHash(temporaryPassword);
          const freshActor=requireUser(request,{admin:true});targetFor(freshActor,b.id);
          tx(()=>{db.prepare('UPDATE access_users SET password_hash=?,must_change=1,temporary_expires=? WHERE id=?').run(encoded,now()+7*86400000,target.id);db.prepare('DELETE FROM access_sessions WHERE user_id=?').run(target.id);audit('password_reset',actor.email,target.email);});
          return json({ok:true,user:publicUser(store.user(target.id)),temporaryPassword,expires:now()+7*86400000});
        }else{
          tx(()=>{db.prepare('UPDATE access_users SET status=? WHERE id=?').run(b.action==='block'?'blocked':'approved',target.id);db.prepare('DELETE FROM access_sessions WHERE user_id=?').run(target.id);audit(b.action==='block'?'access_blocked':'access_restored',actor.email,target.email);});
        }
        return json({ok:true,user:publicUser(store.user(target.id))});
      }
      throw new HttpError('Страница не найдена.',404);
    }catch(error){
      if(error instanceof HttpError)return json({message:error.message},error.status,error.status===429?{'Retry-After':'60'}:{});
      // Never log request bodies, passwords, cookies or database rows.
      console.error('MRP access request failed:',error.name);
      return json({message:'Сервер не смог выполнить действие. Обновите список перед повторной попыткой.'},500);
    }
  }
  return {handle,store,close:()=>store.close()};
}
