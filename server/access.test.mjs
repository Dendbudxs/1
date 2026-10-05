import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,rmSync,readFileSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { readConfig,openStore } from './access-store.mjs';
import { createApplication } from './application.mjs';

const ownerPassword='test owner passphrase 2026';
const siteDir=resolve('dist');
const testTemp=resolve('.access-test-tmp');
mkdirSync(testTemp,{recursive:true,mode:0o700});
async function fixture(t,{disk=false,secure=false}={}){
  const dir=disk?mkdtempSync(join(testTemp,'mrp-access-test-')):null;
  const config=readConfig({APP_URL:secure?'https://mrp.example.test':'http://127.0.0.1:8787',OWNER_EMAIL:'amurtigered@gmail.com',AUTH_DB_PATH:dir?join(dir,'access.sqlite'):undefined});
  let clock=Date.now();
  const app=createApplication(config,{siteDir,dbPath:disk?config.dbPath:':memory:',now:()=>clock});
  const owner=await app.store.createOwner(ownerPassword);
  t.after(()=>{app.close();if(dir)rmSync(dir,{recursive:true,force:true});});
  let sequence=0;
  async function request(path,{method='GET',body,cookie,csrf,origin=config.origin,raw,headers={}}={}){
    const h={...headers};if(cookie)h.Cookie=cookie;if(csrf)h['X-CSRF-Token']=csrf;
    if(method==='POST'){h.Origin=origin;h['Content-Type']='application/json';}
    const r=await app.handle(new Request(config.origin+path,{method,headers:h,...(method==='POST'?{body:raw??JSON.stringify(body||{})}:{})}),{ip:'fixture-'+(++sequence)});
    const text=await r.text();let json;try{json=JSON.parse(text);}catch{}
    return {status:r.status,headers:r.headers,text,json};
  }
  async function login(email,password){const r=await request('/api/login',{method:'POST',body:{email,password}});const cookie=r.headers.get('set-cookie')?.split(';')[0];const info=cookie?await request('/api/session',{cookie}):null;return {...r,cookie,csrf:info?.json?.csrf,user:info?.json?.user};}
  return {app,config,request,login,owner,advance:delta=>{clock+=delta;}};
}

test('anonymous readers cannot obtain the catalog or administration',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request('/')).status,303);
  for(const path of ['/data.js','/department-data.js','/app.js','/index.html?bypass=1','/api/admin/users'])assert.notEqual((await f.request(path)).status,200,path);
  for(const path of ['/data.js','/department-data.js','/api/admin/users'])assert.equal((await f.request(path)).status,401,path);
  assert.equal((await f.request('/login')).status,200);
  assert.equal((await f.request('/access.css')).status,200);
  assert(!((await f.request('/login')).text.includes('cassie-')));
  assert.equal((await f.request('/api/login',{method:'POST',body:{email:f.owner.email,password:ownerPassword},origin:'https://wrong.example'})).status,403);
  assert.equal((await f.request('/api/login',{method:'POST',raw:'x'.repeat(9000)})).status,413);
});

test('owner creates a reader, first password change gates data, and revoke closes all sessions',async t=>{
  const f=await fixture(t),owner=await f.login('amurtigered@gmail.com',ownerPassword);
  assert.equal(owner.status,200);assert.match(owner.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  assert.equal(owner.user.role,'owner');
  const auth={method:'POST',cookie:owner.cookie,csrf:owner.csrf};
  const denied=await f.request('/api/admin/create',{...auth,csrf:undefined,body:{email:'reader@example.test',name:'Reader'}});
  assert.equal(denied.status,403);
  assert.equal((await f.request('/api/admin/create',{...auth,origin:'https://other.example',body:{}})).status,403);
  const created=await f.request('/api/admin/create',{...auth,body:{email:'reader@example.test',name:'<img src=x onerror=alert(1)>',role:'member'}});
  assert.equal(created.status,201);assert(created.json.temporaryPassword);const member=created.json.user;
  assert(!f.app.store.user(member.id).password_hash.includes(created.json.temporaryPassword));
  assert.equal((await f.request('/api/admin/create',{...auth,body:{email:member.email,name:'Duplicate',role:'member'}})).status,409);
  const first=await f.login(member.email,created.json.temporaryPassword);assert.equal(first.status,200);assert.equal(first.json.redirect,'/account/password');
  assert.equal((await f.request('/data.js',{cookie:first.cookie})).status,428);
  assert.equal((await f.request('/api/admin/users',{cookie:first.cookie})).status,428);
  const changed=await f.request('/api/password',{method:'POST',cookie:first.cookie,csrf:first.csrf,body:{currentPassword:created.json.temporaryPassword,newPassword:'reader personal passphrase 2026'}});
  assert.equal(changed.status,200);const readerCookie=changed.headers.get('set-cookie').split(';')[0];
  assert.equal((await f.request('/data.js',{cookie:first.cookie})).status,401);
  const readable=await f.request('/data.js',{cookie:readerCookie});assert.equal(readable.status,200);assert(readable.text.includes('cassie-0255'));assert.match(readable.headers.get('cache-control'),/no-store/);
  const info=await f.request('/api/session',{cookie:readerCookie});assert.equal(info.json.user.role,'member');assert(!info.text.includes('password_hash'));
  assert.equal((await f.request('/api/admin/users',{cookie:readerCookie})).status,403);
  assert.equal((await f.request('/api/admin/create',{method:'POST',cookie:readerCookie,csrf:info.json.csrf,body:{email:'forged@example.test',name:'Forged',role:'admin'}})).status,403);
  const another=await f.login(member.email,'reader personal passphrase 2026');assert.equal(another.status,200);
  assert.equal((await f.request('/api/admin/change',{...auth,body:{id:member.id,action:'block'}})).status,200);
  for(const cookie of [readerCookie,another.cookie])assert.equal((await f.request('/data.js',{cookie})).status,401);
  assert.equal((await f.login(member.email,'reader personal passphrase 2026')).status,401);
  assert.equal((await f.request('/api/admin/change',{...auth,body:{id:member.id,action:'restore'}})).status,200);
  assert.equal((await f.request('/data.js',{cookie:readerCookie})).status,401);
  const restored=await f.login(member.email,'reader personal passphrase 2026');assert.equal(restored.status,200);
  const reset=await f.request('/api/admin/change',{...auth,body:{id:member.id,action:'reset'}});assert.equal(reset.status,200);assert(reset.json.temporaryPassword);
  assert.equal((await f.request('/api/session',{cookie:restored.cookie})).status,401);
  assert.equal((await f.login(member.email,'reader personal passphrase 2026')).status,401);
  const newFirst=await f.login(member.email,reset.json.temporaryPassword);assert.equal(newFirst.status,200);assert(newFirst.user.mustChange);
  const list=await f.request('/api/admin/users',{cookie:owner.cookie});assert.equal(list.status,200);assert.equal(list.json.users.length,2);assert(!list.text.includes('scrypt$'));assert(!list.text.includes(reset.json.temporaryPassword));
  assert(list.json.audit.some(a=>a.event==='access_blocked'&&a.actor===owner.user.email&&a.target===member.email));
});

test('owner protection, administrators cannot elevate roles or change another administrator',async t=>{
  const f=await fixture(t),owner=await f.login('amurtigered@gmail.com',ownerPassword),auth={method:'POST',cookie:owner.cookie,csrf:owner.csrf};
  for(const action of ['block','restore','reset','role'])assert.equal((await f.request('/api/admin/change',{...auth,body:{id:f.owner.id,action,role:'member'}})).status,403,action);
  const make=async(email,role)=>f.request('/api/admin/create',{...auth,body:{email,name:email,role}});
  const a=await make('admin@example.test','admin'),b=await make('other-admin@example.test','admin'),m=await make('member@example.test','member');
  const initial=await f.login(a.json.user.email,a.json.temporaryPassword);
  const changed=await f.request('/api/password',{method:'POST',cookie:initial.cookie,csrf:initial.csrf,body:{currentPassword:a.json.temporaryPassword,newPassword:'admin personal passphrase 2026'}});
  const cookie=changed.headers.get('set-cookie').split(';')[0],session=await f.request('/api/session',{cookie});
  const adminAuth={method:'POST',cookie,csrf:session.json.csrf};
  assert.equal((await f.request('/api/admin/users',{cookie})).status,200);
  assert.equal((await f.request('/api/admin/create',{...adminAuth,body:{email:'new-admin@example.test',name:'New',role:'admin'}})).status,403);
  for(const target of [a.json.user,b.json.user,f.owner])assert.equal((await f.request('/api/admin/change',{...adminAuth,body:{id:target.id,action:'block'}})).status,403);
  assert.equal((await f.request('/api/admin/change',{...adminAuth,body:{id:m.json.user.id,action:'role',role:'admin'}})).status,403);
  assert.equal((await f.request('/api/admin/change',{...adminAuth,body:{id:m.json.user.id,action:'block'}})).status,200);
  assert.equal((await f.request('/api/admin/change',{...auth,body:{id:a.json.user.id,action:'role',role:'member'}})).status,200);
  assert.equal((await f.request('/api/admin/users',{cookie})).status,401);
  const relogin=await f.login(a.json.user.email,'admin personal passphrase 2026');assert.equal(relogin.user.role,'member');assert.equal((await f.request('/api/admin/users',{cookie:relogin.cookie})).status,403);
});

test('sessions, temporary passwords expire; secure cookies, traversal and duplicate cookies are handled',async t=>{
  const f=await fixture(t,{secure:true}),owner=await f.login('amurtigered@gmail.com',ownerPassword);
  assert.match(owner.cookie,/^__Host-mrp-session=/);assert.match(owner.headers.get('set-cookie'),/; Secure/);
  assert.equal((await f.request('/api/session',{cookie:owner.cookie+'; '+owner.cookie})).status,401);
  for(const path of ['/../.env','/%2e%2e/private-data/access.sqlite','/server/access-store.mjs','/private-data/access.sqlite','/.openai/hosting.json'])assert.equal((await f.request(path,{cookie:owner.cookie})).status,404,path);
  const auth={method:'POST',cookie:owner.cookie,csrf:owner.csrf};
  const member=await f.request('/api/admin/create',{...auth,body:{email:'expiry@example.test',name:'Expiry'}});
  f.advance(6*86400000);
  const almostExpired=await f.login(member.json.user.email,member.json.temporaryPassword);assert.equal(almostExpired.status,200);
  f.advance(86400000+1);
  assert.equal((await f.request('/api/session',{cookie:almostExpired.cookie})).status,401);
  assert.equal((await f.request('/api/session',{cookie:owner.cookie})).status,401);
  assert.equal((await f.login(member.json.user.email,member.json.temporaryPassword)).status,401);
  assert.equal((await f.login('amurtigered@gmail.com',ownerPassword)).status,200);
  assert.throws(()=>readConfig({APP_URL:'http://mrp.example.test',OWNER_EMAIL:'amurtigered@gmail.com'}),/HTTPS/);
});

test('access remains after restarting the persistent store; real HTTP server protects the files',async t=>{
  const dir=mkdtempSync(join(testTemp,'mrp-http-test-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const reservation=createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
  const origin='http://127.0.0.1:'+port,dbPath=join(dir,'access.sqlite');
  const config=readConfig({APP_URL:origin,OWNER_EMAIL:'amurtigered@gmail.com',AUTH_DB_PATH:dbPath});
  const store=openStore(config);await store.createOwner(ownerPassword);store.close();
  const reopened=openStore(config);assert.equal(reopened.db.prepare('SELECT COUNT(*) n FROM access_users').get().n,1);await assert.rejects(reopened.createOwner('another password phrase'),/уже создан/);reopened.close();
  const child=spawn(process.execPath,['server/start.mjs'],{cwd:resolve('.'),env:{...process.env,APP_URL:origin,OWNER_EMAIL:'amurtigered@gmail.com',AUTH_DB_PATH:dbPath,PORT:String(port),HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',b=>{output+=b});child.stderr.on('data',b=>{output+=b});
  t.after(async()=>{if(child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}});
  for(let i=0;i<30&&!output.includes('Mandarin Medium RP');i++){if(child.exitCode!==null)throw Error(output);await delay(50);}
  assert(output.includes('Mandarin Medium RP'),output);
  const anonymous=await fetch(origin+'/data.js');assert.equal(anonymous.status,401);assert(!(await anonymous.text()).includes('cassie-'));
  const login=await fetch(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'amurtigered@gmail.com',password:ownerPassword})});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const page=await fetch(origin+'/admin',{headers:{Cookie:cookie}});assert.equal(page.status,200);assert.match(await page.text(),/data-access-server="true"/);
  const data=await fetch(origin+'/data.js',{headers:{Cookie:cookie}});assert.equal(data.status,200);assert.equal(await data.text(),readFileSync(join(siteDir,'data.js'),'utf8'));
  const denied=await fetch(origin+'/api/admin/change',{method:'POST',headers:{Cookie:cookie,Origin:'https://attacker.example','Content-Type':'application/json'},body:JSON.stringify({action:'block'})});assert.equal(denied.status,403);
});

test('invalid logins receive a generic failure and repeated attempts are bounded',async t=>{
  const f=await fixture(t);
  const run=email=>f.app.handle(new Request(f.config.origin+'/api/login',{method:'POST',headers:{Origin:f.config.origin,'Content-Type':'application/json'},body:JSON.stringify({email,password:'wrong password phrase'})}),{ip:'same-ip'});
  const missing=await run('unknown@example.test'),wrong=await run(f.owner.email);assert.equal(missing.status,401);assert.equal(wrong.status,401);assert.equal(await missing.text(),await wrong.text());
  for(let i=0;i<6;i++)assert.equal((await run('unknown@example.test')).status,401);
  const limited=await run('unknown@example.test');assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'60');
});
