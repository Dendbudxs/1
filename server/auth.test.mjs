import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync,mkdtempSync,rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApplication,readConfig } from './auth.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const OWNER={sub:'111111111111111111111',email:'owner.fixture@gmail.com',name:'Владелец'};
const MEMBER={sub:'222222222222222222222',email:'member.fixture@gmail.com',name:'Ивентер'};
const OTHER={sub:'333333333333333333333',email:'other.fixture@gmail.com',name:'Другой участник'};
const EXTERNAL={sub:'444444444444444444444',email:'external@fixture.example',name:'Внешняя почта'};
const env={APP_URL:'https://docs.example.test',GOOGLE_CLIENT_ID:'fixture-123.apps.googleusercontent.com',GOOGLE_CLIENT_SECRET:'fixture-not-a-real-google-secret',OWNER_GOOGLE_EMAIL:OWNER.email};
const cookieName='__Host-mandarin-google',stateCookie='__Host-mandarin-google-state';
const setCookie=(r,name)=>r.headers.getSetCookie().find(value=>value.startsWith(name+'='))?.split(';')[0]||'';
function harness(t,{config:overrides={},dbPath=':memory:',exchange}={}){
  const config=readConfig({...env,...overrides});let time=Date.UTC(2026,8,24),closed=false,index=0;
  const codes=new Map(),calls=[];
  const provider={async exchange(code,verifier){
    calls.push({code,verifier});const record=codes.get(code);if(!record)throw Error('Unknown code');
    assert.equal(createHash('sha256').update(verifier).digest('base64url'),record.challenge);
    if(exchange)return exchange(record.claims);return record.claims;
  }};
  const app=createApplication(config,{siteDir:resolve(root,'dist'),provider,now:()=>time,dbPath});
  const close=()=>{if(!closed){app.close();closed=true;}};t.after(close);
  const request=(path,{cookie='',headers={},...options}={})=>app.handle(new Request(config.origin+path,{...options,headers:{...headers,...(cookie?{Cookie:cookie}:{})}}));
  async function begin(){
    const response=await request('/auth/google');assert.equal(response.status,303);
    const url=new URL(response.headers.get('location'));
    return {response,url,cookie:setCookie(response,stateCookie),state:url.searchParams.get('state')};
  }
  async function prepare(user=MEMBER,changes={}){
    const start=await begin(),code='fixture-code-'+(++index);
    codes.set(code,{challenge:start.url.searchParams.get('code_challenge'),claims:{...user,iss:'https://accounts.google.com',aud:config.clientId,iat:time/1000,exp:time/1000+3600,email_verified:true,nonce:start.url.searchParams.get('nonce'),...changes}});
    return {...start,code,path:'/auth/google/callback?state='+start.state+'&code='+code};
  }
  async function login(user=MEMBER,{claims={},previous=''}={}){
    const start=await prepare(user,claims),response=await request(start.path,{cookie:[start.cookie,previous].filter(Boolean).join('; ')});
    return {response,cookie:setCookie(response,cookieName),start};
  }
  async function session(cookie){const r=await request('/api/session',{cookie});assert.equal(r.status,200);return r.json();}
  async function post(cookie,path,payload,headers={}){
    const user=await session(cookie);
    return request(path,{cookie,method:'POST',headers:{Origin:config.origin,'X-CSRF-Token':user.csrf,'Content-Type':'application/json',...headers},body:JSON.stringify(payload)});
  }
  const allow=(cookie,email)=>post(cookie,'/api/admin/emails',{email});
  const act=(cookie,user,action)=>post(cookie,'/api/admin/users/'+user.sub,{action});
  const admin=async(cookie,query='')=>{const r=await request('/api/admin'+query,{cookie});assert.equal(r.status,200);return r.json();};
  return {config,codes,calls,request,begin,prepare,login,session,post,allow,act,admin,close,advance:ms=>{time+=ms;}};
}

test('anonymous requests and guessed static paths cannot expose the knowledge base or admin data',async t=>{
  const h=harness(t);
  for(const method of ['GET','HEAD'])for(const path of ['/','/index.html','/data.js','/catalog.js','/departments.js','/app.js','/admin','/admin/help','/admin.js','/api/admin']){
    const r=await h.request(path,{method});assert.notEqual(r.status,200,method+' '+path);assert.match(r.headers.get('cache-control'),/no-store/);
  }
  for(const path of ['/dist/data.js','/%64ata.js','/assets/../data.js','/server/auth.mjs','/.env','/private-data/google-auth.sqlite','/node_modules/google-auth-library/package.json'])assert.ok([401,404].includes((await h.request(path)).status),path);
  for(const path of ['/access','/login.html','/privacy.html','/assets/google-g.png'])assert.equal((await h.request(path)).status,200);
});

test('missing configuration fails closed and remote plaintext origins are rejected',async t=>{
  assert.throws(()=>readConfig({...env,APP_URL:'http://example.test'}),/HTTPS/);
  assert.throws(()=>readConfig({...env,APP_URL:'https://example.test/path'}),/origin/);
  const h=harness(t,{config:{OWNER_GOOGLE_EMAIL:''}});
  assert.equal((await h.request('/data.js')).status,503);assert.equal((await h.request('/auth/google')).status,503);
});

test('OAuth uses Google with minimal profile scopes, nonce, PKCE and secure browser binding',async t=>{
  const h=harness(t),start=await h.prepare(OWNER);
  assert.equal(start.url.origin,'https://accounts.google.com');assert.equal(start.url.searchParams.get('scope'),'openid email profile');
  assert.equal(start.url.searchParams.get('code_challenge_method'),'S256');assert.equal(start.url.searchParams.get('access_type'),null);
  assert.equal(start.url.searchParams.get('redirect_uri'),h.config.origin+'/auth/google/callback');
  assert.match(start.response.headers.get('set-cookie'),/HttpOnly.*SameSite=Lax.*Secure/);
  assert.equal((await h.request(start.path)).status,400);
  assert.equal((await h.request(start.path,{cookie:stateCookie+'='+'x'.repeat(43)})).status,400);
  assert.equal((await h.request(start.path,{cookie:start.cookie})).status,303);
  assert.equal((await h.request(start.path,{cookie:start.cookie})).status,400);assert.equal(h.calls.length,1);
});

test('Render origin produces the exact HTTPS callback and explicit APP_URL takes precedence',async t=>{
  const renderURL='https://mandarin-fixture.onrender.com';
  const h=harness(t,{config:{APP_URL:'',RENDER_EXTERNAL_URL:renderURL}}),start=await h.begin();
  assert.equal(start.url.searchParams.get('redirect_uri'),renderURL+'/auth/google/callback');
  assert.match(start.response.headers.get('set-cookie'),/Secure/);
  assert.equal(readConfig({...env,RENDER_EXTERNAL_URL:renderURL}).origin,env.APP_URL);
  assert.throws(()=>readConfig({...env,APP_URL:'',RENDER_EXTERNAL_URL:'http://example.test'}),/HTTPS/);
});

test('expired state and cancelled consent never exchange a code',async t=>{
  const h=harness(t),start=await h.prepare(OWNER);h.advance(600001);
  assert.equal((await h.request(start.path,{cookie:start.cookie})).status,400);
  const cancelled=await h.begin();assert.equal((await h.request('/auth/google/callback?state='+cancelled.state+'&error=access_denied',{cookie:cancelled.cookie})).status,403);assert.equal(h.calls.length,0);
});

test('wrong nonce, issuer, audience, presenter, expiry or unverified email cannot start a session',async t=>{
  const h=harness(t);
  const cases=[{nonce:'wrong'},{iss:'https://attacker.invalid'},{aud:'another-client'},{azp:'another-client'},{exp:1},{iat:9999999999},{email_verified:false},{email:'not an address'}];
  for(const claims of cases){const result=await h.login(OWNER,{claims});assert.equal(result.response.status,401,JSON.stringify(claims));assert.equal(result.cookie,'');}
});

test('first visitor stays pending and cannot become owner or read documents',async t=>{
  const h=harness(t),member=await h.login();assert.equal(member.response.status,303);assert.equal(member.response.headers.get('location'),'/access');
  assert.equal((await h.session(member.cookie)).status,'pending');
  assert.equal((await h.request('/data.js',{cookie:member.cookie})).status,403);
  assert.equal((await h.request('/api/admin',{cookie:member.cookie})).status,403);
  const owner=await h.login(OWNER);assert.equal((await h.session(owner.cookie)).isOwner,true);
  assert.equal((await h.act(owner.cookie,MEMBER,'approve')).status,200);
  assert.equal((await h.request('/data.js',{cookie:member.cookie})).status,200);
  assert.equal((await h.request('/admin',{cookie:member.cookie})).status,403);
});

test('preapproved Gmail enters directly and adding an existing Gmail request opens the active session',async t=>{
  const h=harness(t),owner=await h.login(OWNER);assert.equal((await h.allow(owner.cookie,MEMBER.email.toUpperCase())).status,200);
  const member=await h.login();assert.equal(member.response.headers.get('location'),'/');
  const other=await h.login(OTHER);await h.allow(owner.cookie,OTHER.email);
  assert.equal((await h.request('/catalog.js',{cookie:other.cookie})).status,200);
  const result=await h.admin(owner.cookie);assert.equal(result.counts.approved,3);assert.equal(result.counts.pending,0);
});

test('Google Workspace can claim a preapproved email; third-party email requires a decision on its Google account',async t=>{
  const h=harness(t),owner=await h.login(OWNER);await h.allow(owner.cookie,EXTERNAL.email);
  const external=await h.login(EXTERNAL);assert.equal((await h.session(external.cookie)).status,'pending');
  await h.act(owner.cookie,EXTERNAL,'approve');assert.equal((await h.request('/data.js',{cookie:external.cookie})).status,200);
  const workspace={...OTHER,email:'employee@workspace.example'};await h.allow(owner.cookie,workspace.email);
  assert.equal((await h.login(workspace,{claims:{hd:'workspace.example'}})).response.headers.get('location'),'/');
});

test('owner bootstrap requires Google-hosted email and pins the immutable Google subject',async t=>{
  const h=harness(t,{config:{OWNER_GOOGLE_EMAIL:EXTERNAL.email}});
  assert.equal((await h.login(EXTERNAL)).response.status,403);
  const owner=await h.login(EXTERNAL,{claims:{hd:'fixture.example'}});assert.equal((await h.session(owner.cookie)).isOwner,true);
  assert.equal((await h.login({...EXTERNAL,sub:OTHER.sub},{claims:{hd:'fixture.example'}})).response.status,403);
});

test('approved email cannot be taken over by another Google subject',async t=>{
  const h=harness(t),owner=await h.login(OWNER);await h.allow(owner.cookie,MEMBER.email);await h.login();
  const result=await h.login({...MEMBER,sub:OTHER.sub});assert.equal(result.response.status,403);assert.equal(result.cookie,'');
  const logs=await h.admin(owner.cookie,'?tab=audit');assert.ok(logs.rows.some(x=>x.reason==='account_mismatch'));
});

test('a changed Google email requires a new grant and old sessions cannot bypass it',async t=>{
  const h=harness(t),owner=await h.login(OWNER);await h.allow(owner.cookie,MEMBER.email);const member=await h.login();
  const changed=await h.login({...MEMBER,email:'changed.fixture@gmail.com'});assert.equal((await h.session(changed.cookie)).status,'pending');
  assert.equal((await h.request('/data.js',{cookie:member.cookie})).status,403);
});

test('CSRF, cross-origin requests and attempts to revoke the owner are rejected',async t=>{
  const h=harness(t),owner=await h.login(OWNER);
  for(const headers of [{Origin:'https://attacker.invalid'},{'X-CSRF-Token':'wrong'},{'X-CSRF-Token':'é'.repeat(43)},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await h.post(owner.cookie,'/api/admin/emails',{email:MEMBER.email},headers)).status,403);
  assert.equal((await h.allow(owner.cookie,OWNER.email)).status,400);
  assert.equal((await h.act(owner.cookie,OWNER,'block')).status,400);
  const grants=await h.admin(owner.cookie);assert.equal((await h.post(owner.cookie,'/api/admin/grants/'+grants.rows[0].id,{action:'block'})).status,400);
});

test('revocation deletes every session; restoring permission never revives old cookies',async t=>{
  const h=harness(t),owner=await h.login(OWNER);await h.allow(owner.cookie,MEMBER.email);
  const first=await h.login(),second=await h.login();assert.equal((await h.request('/data.js',{cookie:first.cookie})).status,200);
  await h.act(owner.cookie,MEMBER,'block');
  for(const cookie of [first.cookie,second.cookie])assert.equal((await h.request('/data.js',{cookie})).status,401);
  assert.equal((await h.login()).response.status,403);
  const grant=(await h.admin(owner.cookie)).rows.find(x=>x.email===MEMBER.email);
  await h.post(owner.cookie,'/api/admin/grants/'+grant.id,{action:'approve'});
  assert.equal((await h.request('/data.js',{cookie:first.cookie})).status,401);assert.equal((await h.login()).response.headers.get('location'),'/');
});

test('a rejected pending request can later be restored from the access list',async t=>{
  const h=harness(t),owner=await h.login(OWNER);await h.login();await h.act(owner.cookie,MEMBER,'block');
  const row=(await h.admin(owner.cookie)).rows.find(x=>x.email===MEMBER.email);assert.equal(row.status,'blocked');
  await h.post(owner.cookie,'/api/admin/grants/'+row.id,{action:'approve'});assert.equal((await h.login()).response.status,303);
});

test('block wins while an OAuth exchange is still in flight',async t=>{
  let delay=false,release;const wait=new Promise(resolve=>{release=resolve;});
  const h=harness(t,{exchange:async claims=>{if(delay&&claims.sub===MEMBER.sub)await wait;return claims;}});
  const owner=await h.login(OWNER);await h.allow(owner.cookie,MEMBER.email);await h.login();delay=true;
  const pending=h.login();await new Promise(resolve=>setImmediate(resolve));await h.act(owner.cookie,MEMBER,'block');release();
  assert.equal((await pending).response.status,403);
});

test('opaque cookies rotate, reject duplicates/forgeries and expire after seven days',async t=>{
  const h=harness(t),first=await h.login(OWNER),header=first.response.headers.getSetCookie().find(x=>x.startsWith(cookieName+'='));
  assert.match(header,/HttpOnly.*SameSite=Lax.*Secure/);assert.doesNotMatch(header,/Domain=/);
  assert.equal((await h.request('/data.js',{cookie:cookieName+'='+'x'.repeat(43)})).status,401);
  assert.equal((await h.request('/data.js',{cookie:first.cookie+'; '+first.cookie})).status,401);
  const next=await h.login(OWNER,{previous:first.cookie});assert.notEqual(first.cookie,next.cookie);assert.equal((await h.request('/data.js',{cookie:first.cookie})).status,401);
  h.advance(7*86400000+1);assert.equal((await h.request('/data.js',{cookie:next.cookie})).status,401);
});

test('logout requires CSRF and invalidates its session',async t=>{
  const h=harness(t),owner=await h.login(OWNER);
  assert.equal((await h.request('/api/logout',{cookie:owner.cookie,method:'POST'})).status,403);
  const result=await h.post(owner.cookie,'/api/logout',{});assert.equal(result.status,200);assert.match(result.headers.get('set-cookie'),/Max-Age=0/);
  assert.equal((await h.request('/data.js',{cookie:owner.cookie})).status,401);
});

test('names are escaped, malformed bodies are rejected, and secrets are absent from admin responses',async t=>{
  const h=harness(t),owner=await h.login({...OWNER,name:'<img src=x onerror=alert(1)>'});
  const html=await (await h.request('/',{cookie:owner.cookie})).text();assert.doesNotMatch(html,/<img src=x onerror=/);assert.match(html,/access-client\.js/);
  const u=await h.session(owner.cookie),headers={Origin:h.config.origin,'X-CSRF-Token':u.csrf,'Content-Type':'application/json'};
  for(const data of ['null','[]','{'])assert.equal((await h.request('/api/admin/emails',{cookie:owner.cookie,method:'POST',headers,body:data})).status,400);
  assert.equal((await h.request('/api/admin/emails',{cookie:owner.cookie,method:'POST',headers,body:JSON.stringify({email:MEMBER.email,filler:'x'.repeat(5000)})})).status,413);
  assert.doesNotMatch(JSON.stringify(await h.admin(owner.cookie)),/clientSecret|fixture-not-a-real|csrf|verifier|id_token/);
});

test('email search and pagination do not hide older entries or treat SQL syntax as a query',async t=>{
  const h=harness(t),owner=await h.login(OWNER);
  for(let i=0;i<27;i++)assert.equal((await h.allow(owner.cookie,'fixture'+i+'@gmail.com')).status,200);
  const first=await h.admin(owner.cookie),second=await h.admin(owner.cookie,'?offset=25');assert.equal(first.total,28);assert.equal(first.rows.length,25);assert.equal(second.rows.length,3);
  const search=await h.admin(owner.cookie,'?q=fixture26%40gmail.com');assert.equal(search.total,1);
  assert.equal((await h.admin(owner.cookie,"?q='+OR+1%3D1--")).total,0);
});

test('Google failure never grants a new session',async t=>{
  const h=harness(t,{exchange:async()=>{throw Error('Fixture unavailable');}}),result=await h.login(OWNER);
  assert.equal(result.response.status,503);assert.equal(result.cookie,'');
});

test('Google grants survive restart, cookies are hashed, and another owner cannot reuse the database',async t=>{
  const base=resolve(root,'private-data');mkdirSync(base,{recursive:true});const temporary=mkdtempSync(resolve(base,'test-google-'));
  t.after(()=>rmSync(temporary,{recursive:true,force:true}));
  const dbPath=resolve(temporary,'google.sqlite'),h=harness(t,{dbPath}),owner=await h.login(OWNER);await h.allow(owner.cookie,MEMBER.email);const member=await h.login();h.close();
  const db=new DatabaseSync(dbPath),session=db.prepare('SELECT * FROM sessions WHERE user_sub=?').get(MEMBER.sub);
  assert.equal(session.id,createHash('sha256').update(member.cookie.split('=')[1]).digest('hex'));assert.ok(!Object.keys(session).some(x=>/token/.test(x)));db.close();
  const reopened=harness(t,{dbPath});assert.equal((await reopened.request('/data.js',{cookie:member.cookie})).status,200);reopened.close();
  assert.throws(()=>createApplication(readConfig({...env,OWNER_GOOGLE_EMAIL:OTHER.email}),{siteDir:resolve(root,'dist'),dbPath}),/different configuration/);
});
