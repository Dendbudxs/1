import { createHash,randomBytes,timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync,chmodSync,readFileSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { createGoogleProvider } from './google-provider.mjs';
import { page,accessPage,adminPage,accountBar,privacyPage,helpPage } from './pages.mjs';

const DAY=86400000,SESSION_LIFETIME=7*DAY;
const opaquePattern=/^[A-Za-z0-9_-]{43}$/;
const subjectPattern=/^[A-Za-z0-9_-]{6,255}$/;
const random=()=>randomBytes(32).toString('base64url');
const hash=value=>createHash('sha256').update(String(value)).digest('hex');
const challenge=value=>createHash('sha256').update(value).digest('base64url');
const equal=(a,b)=>{
  if(typeof a!=='string'||typeof b!=='string')return false;
  const x=Buffer.from(a),y=Buffer.from(b);
  return x.length===y.length&&timingSafeEqual(x,y);
};
export function normalizeEmail(value) {
  if(typeof value!=='string')return '';
  const email=value.trim().toLowerCase();
  // Match the address reported by Google exactly, without alias/dot rewriting.
  return email.length<=254&&/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(email)?email:'';
}
class AccessError extends Error {
  constructor(reason,status=403){super(reason);this.reason=reason;this.status=status;}
}
export function readConfig(env=process.env) {
  // Render supplies a stable HTTPS origin; never infer it from request headers.
  const url=new URL(env.APP_URL||env.RENDER_EXTERNAL_URL||'http://127.0.0.1:8787');
  if(url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw Error('APP_URL must be an origin without a path or credentials.');
  const local=url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.protocol!=='https:'&&!local)throw Error('HTTPS is required outside localhost.');
  const config={
    origin:url.origin,secure:!local,clientId:env.GOOGLE_CLIENT_ID||'',clientSecret:env.GOOGLE_CLIENT_SECRET||'',
    ownerEmail:normalizeEmail(env.OWNER_GOOGLE_EMAIL),dbPath:resolve(env.AUTH_DB_PATH||'private-data/google-auth.sqlite')
  };
  config.ready=/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(config.clientId)&&config.clientSecret.length>=16&&!!config.ownerEmail;
  return config;
}
function cookies(request) {
  const result=Object.create(null);
  for(const part of (request.headers.get('cookie')||'').split(';')){
    const at=part.indexOf('=');if(at<0)continue;
    const key=part.slice(0,at).trim();result[key]=Object.hasOwn(result,key)?'':part.slice(at+1).trim();
  }
  return result;
}

export function createApplication(config,{siteDir=resolve('dist'),provider,now=Date.now,dbPath=config.dbPath}={}) {
  if(dbPath!==':memory:')mkdirSync(dirname(dbPath),{recursive:true,mode:0o700});
  const db=new DatabaseSync(dbPath);
  if(dbPath!==':memory:')chmodSync(dbPath,0o600);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  const existing=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  if(existing&&!db.prepare('PRAGMA table_info(users)').all().some(c=>c.name==='sub')){
    db.close();throw Error('This is an old Discord database. Set AUTH_DB_PATH to a new google-auth.sqlite file.');
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      sub TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,authoritative INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending','approved','blocked')),created INTEGER NOT NULL,last_login INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE TABLE IF NOT EXISTS grants (
      id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE,sub TEXT REFERENCES users(sub),
      status TEXT NOT NULL CHECK(status IN ('approved','blocked')),created INTEGER NOT NULL,updated INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_grants_sub ON grants(sub);
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,user_sub TEXT NOT NULL REFERENCES users(sub),expires INTEGER NOT NULL,csrf TEXT NOT NULL,created INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_sub);
    CREATE TABLE IF NOT EXISTS states (id TEXT PRIMARY KEY,binding TEXT NOT NULL,nonce TEXT NOT NULL,verifier TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY,at INTEGER NOT NULL,event TEXT NOT NULL,actor TEXT,target TEXT,reason TEXT);
    CREATE INDEX IF NOT EXISTS idx_audit_date ON audit(at);
    CREATE TABLE IF NOT EXISTS deployment_meta (name TEXT PRIMARY KEY,value TEXT NOT NULL);
    PRAGMA optimize;
  `);
  if(config.ready){
    const binding=hash(['google-v1',config.origin,config.clientId,config.ownerEmail].join('\n'));
    const previous=db.prepare('SELECT value FROM deployment_meta WHERE name=?').get('binding');
    if(previous&&previous.value!==binding){db.close();throw Error('Access database belongs to a different configuration. See SECURE_SETUP.md.');}
    db.prepare('INSERT OR IGNORE INTO deployment_meta(name,value) VALUES(?,?)').run('binding',binding);
  }
  const google=provider||(config.ready?createGoogleProvider(config):null);
  const sessionCookie=config.secure?'__Host-mandarin-google':'mandarin-google';
  const stateCookie=config.secure?'__Host-mandarin-google-state':'mandarin-google-state';
  const publicFiles=new Map([
    ['/style.css',['style.css','text/css']],['/theme.css',['theme.css','text/css']],['/snow.js',['snow.js','text/javascript']],
    ['/assets/mandarin-snow-brand.png',['assets/mandarin-snow-brand.png','image/png']],
    ['/assets/google-g.png',['assets/google-g.png','image/png']],
    ['/assets/mandarins-containment.png',['assets/mandarins-containment.png','image/png']]
  ]);
  const protectedFiles=new Map([
    ['/',['index.html','text/html']],['/index.html',['index.html','text/html']],['/app.js',['app.js','text/javascript']],
    ['/data.js',['data.js','text/javascript']],['/catalog.js',['catalog.js','text/javascript']],['/departments.js',['departments.js','text/javascript']]
  ]);
  const files=new Map();
  for(const [path,[file,type]] of [...publicFiles,...protectedFiles])files.set(path,{bytes:readFileSync(resolve(siteDir,file)),type});
  for(const [path,name,type] of [['/auth.css','auth.css','text/css'],['/access-client.js','access-client.js','text/javascript'],['/admin.js','admin.js','text/javascript']]){
    files.set(path,{bytes:readFileSync(new URL('./'+name,import.meta.url)),type});
    if(path!=='/admin.js')publicFiles.set(path,[name,type]);
  }
  const buckets=new Map();let lastClean=0,globalWindow=now(),globalAttempts=0;
  function clean(){
    if(now()-lastClean<60000)return;lastClean=now();
    db.prepare('DELETE FROM states WHERE expires<=?').run(now());
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(now());
    db.prepare('DELETE FROM audit WHERE at<?').run(now()-30*DAY);
    for(const [key,value] of buckets)if(value.expires<=now())buckets.delete(key);
  }
  function rate(value){
    if(globalWindow+60000<=now()){globalWindow=now();globalAttempts=0;}
    if(++globalAttempts>1000)throw new AccessError('rate_limited',429);
    const key=hash(value);let bucket=buckets.get(key);
    if(!bucket||bucket.expires<=now()){
      if(buckets.size>=10000)buckets.delete(buckets.keys().next().value);
      bucket={count:0,expires:now()+60000};buckets.set(key,bucket);
    }
    if(++bucket.count>40)throw new AccessError('rate_limited',429);
  }
  function cookie(name,value,seconds=0){return name+'='+value+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+seconds+(config.secure?'; Secure':'');}
  function response(body,status=200,type='text/html',headers={}){
    const h=new Headers({
      'Content-Type':type+(type.startsWith('image/')?'':'; charset=utf-8'),'Cache-Control':'private, no-store, max-age=0',
      Pragma:'no-cache',Vary:'Cookie','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
      'Cross-Origin-Resource-Policy':'same-origin',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      'Permissions-Policy':'camera=(), microphone=(), geolocation=()',...headers
    });
    if(config.secure)h.set('Strict-Transport-Security','max-age=31536000');
    return new Response(body,{status,headers:h});
  }
  const json=(data,status=200)=>response(JSON.stringify(data),status,'application/json');
  const redirect=path=>response('',303,'text/html',{Location:path});
  function file(path,user){
    const item=files.get(path);let bytes=item.bytes;
    if(item.type==='text/html')bytes=Buffer.from(bytes.toString().replace('</head>','<link rel="stylesheet" href="/auth.css"></head>').replace('</header>','</header>'+accountBar(user)).replace('</body>','<script src="/access-client.js" defer></script></body>'));
    return response(bytes,200,item.type);
  }
  function audit(event,actor=null,target=null,reason=null){db.prepare('INSERT INTO audit(at,event,actor,target,reason) VALUES(?,?,?,?,?)').run(now(),event,actor,target,reason);}
  function ownerSub(){return db.prepare('SELECT value FROM deployment_meta WHERE name=?').get('owner_sub')?.value;}
  function approved(user){
    if(user.status!=='approved')return false;
    return !!db.prepare("SELECT 1 FROM grants WHERE sub=? AND email=? AND status='approved'").get(user.sub,user.email);
  }
  function currentUser(request,{requireApproval=true,admin=false}={}){
    if(!config.ready)throw new AccessError('not_configured',503);
    const raw=cookies(request)[sessionCookie];if(!opaquePattern.test(raw||''))throw new AccessError('sign_in_required',401);
    const session=db.prepare('SELECT * FROM sessions WHERE id=? AND expires>?').get(hash(raw),now());
    if(!session)throw new AccessError('sign_in_required',401);
    const user=db.prepare('SELECT * FROM users WHERE sub=?').get(session.user_sub);
    if(!user||user.status==='blocked')throw new AccessError('blocked');
    const allowed=approved(user),isOwner=user.sub===ownerSub()&&user.email===config.ownerEmail;
    if(requireApproval&&!allowed)throw new AccessError('pending_approval');
    if(admin&&!isOwner)throw new AccessError('admin_required');
    return {...user,status:allowed?'approved':'pending',isOwner,sessionId:session.id,csrf:session.csrf};
  }
  function csrf(request,user){
    if(request.headers.get('origin')!==config.origin||request.headers.get('sec-fetch-site')==='cross-site'||!equal(request.headers.get('x-csrf-token'),user.csrf))throw new AccessError('csrf_failed');
  }
  async function bodyJSON(request){
    if(!(request.headers.get('content-type')||'').startsWith('application/json'))throw new AccessError('invalid_request',400);
    if(Number(request.headers.get('content-length')||0)>4096)throw new AccessError('invalid_request',413);
    const reader=request.body?.getReader();if(!reader)throw new AccessError('invalid_request',400);
    let size=0;const parts=[];
    for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>4096){await reader.cancel();throw new AccessError('invalid_request',413);}parts.push(Buffer.from(chunk.value));}
    let value;try{value=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw new AccessError('invalid_request',400);}
    if(!value||typeof value!=='object'||Array.isArray(value))throw new AccessError('invalid_request',400);
    return value;
  }
  function transaction(action){db.exec('BEGIN IMMEDIATE');try{const result=action();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}
  function googleIdentity(claims,nonce){
    if(!claims||!subjectPattern.test(claims.sub||'')||!equal(claims.nonce,nonce)||
      !['accounts.google.com','https://accounts.google.com'].includes(claims.iss)||claims.aud!==config.clientId||
      claims.azp&&claims.azp!==config.clientId||!Number.isFinite(claims.exp)||claims.exp*1000<=now()||
      !Number.isFinite(claims.iat)||claims.iat*1000>now()+300000||claims.email_verified!==true)throw new AccessError('identity_unverified',401);
    const email=normalizeEmail(claims.email);if(!email)throw new AccessError('identity_unverified',401);
    return {sub:claims.sub,email,name:String(claims.name||email).slice(0,100),authoritative:email.endsWith('@gmail.com')||typeof claims.hd==='string'&&claims.hd.length>0?1:0};
  }
  function upsertIdentity(identity){
    const previous=db.prepare('SELECT * FROM users WHERE sub=?').get(identity.sub);
    if(previous?.status==='blocked'){audit('access_denied',identity.email,null,'blocked');throw new AccessError('blocked');}
    let grant=db.prepare('SELECT * FROM grants WHERE email=?').get(identity.email);
    if(grant?.status==='blocked'){audit('access_denied',identity.email,null,'blocked');throw new AccessError('blocked');}
    if(grant?.sub&&grant.sub!==identity.sub){audit('access_denied',identity.email,null,'account_mismatch');throw new AccessError('account_mismatch');}
    const isOwnerEmail=identity.email===config.ownerEmail,owner=ownerSub();
    if(isOwnerEmail&&owner&&owner!==identity.sub)throw new AccessError('account_mismatch');
    if(isOwnerEmail&&!owner&&!identity.authoritative)throw new AccessError('owner_email_untrusted');
    db.prepare("INSERT INTO users(sub,email,name,authoritative,status,created,last_login) VALUES(?,?,?,?,'pending',?,?) ON CONFLICT(sub) DO UPDATE SET email=excluded.email,name=excluded.name,authoritative=excluded.authoritative,last_login=excluded.last_login").run(identity.sub,identity.email,identity.name,identity.authoritative,now(),now());
    if(isOwnerEmail){
      db.prepare('INSERT OR IGNORE INTO deployment_meta(name,value) VALUES(?,?)').run('owner_sub',identity.sub);
      db.prepare("INSERT INTO grants(email,sub,status,created,updated) VALUES(?,?,'approved',?,?) ON CONFLICT(email) DO UPDATE SET sub=excluded.sub,status='approved',updated=excluded.updated").run(identity.email,identity.sub,now(),now());
      grant={sub:identity.sub,status:'approved'};
    }
    // Google-hosted email can claim an unbound email invitation. Other Google
    // accounts require an explicit owner decision on the verified subject.
    if(grant?.status==='approved'&&!grant.sub&&identity.authoritative){
      db.prepare('UPDATE grants SET sub=?,updated=? WHERE email=? AND sub IS NULL').run(identity.sub,now(),identity.email);grant.sub=identity.sub;
    }
    const status=grant?.status==='approved'&&grant.sub===identity.sub?'approved':'pending';
    db.prepare('UPDATE users SET status=? WHERE sub=?').run(status,identity.sub);
    return status;
  }
  function approveUser(sub,actor){
    const user=db.prepare('SELECT * FROM users WHERE sub=?').get(sub);if(!user)throw new AccessError('not_found',404);
    if(sub===ownerSub()||user.email===config.ownerEmail)throw new AccessError('owner_protected',400);
    const grant=db.prepare('SELECT * FROM grants WHERE email=?').get(user.email);
    if(grant?.sub&&grant.sub!==sub)throw new AccessError('account_mismatch',409);
    db.prepare("INSERT INTO grants(email,sub,status,created,updated) VALUES(?,?,'approved',?,?) ON CONFLICT(email) DO UPDATE SET sub=excluded.sub,status='approved',updated=excluded.updated").run(user.email,sub,now(),now());
    db.prepare("UPDATE users SET status='approved' WHERE sub=?").run(sub);audit('access_approved',actor,user.email);
  }
  async function handle(request,{remoteAddress='local'}={}){
    clean();const url=new URL(request.url),path=url.pathname,method=request.method;
    if(url.origin!==config.origin)return response('Некорректный адрес',400,'text/plain');
    try{
      if(path==='/healthz'&&['GET','HEAD'].includes(method)){
        db.prepare('SELECT 1').get();return json({ok:true});
      }
      if(publicFiles.has(path)&&['GET','HEAD'].includes(method))return file(path);
      if(path==='/robots.txt'&&['GET','HEAD'].includes(method))return response('User-agent: *\nDisallow: /\n',200,'text/plain');
      if(['/privacy','/privacy.html'].includes(path)&&method==='GET')return response(privacyPage());
      if(path==='/auth/google'&&method==='GET'){
        if(!config.ready)throw new AccessError('not_configured',503);rate(remoteAddress);
        const state=random(),binding=random(),nonce=random(),verifier=random();
        db.prepare('INSERT INTO states(id,binding,nonce,verifier,expires) VALUES(?,?,?,?,?)').run(hash(state),hash(binding),nonce,verifier,now()+600000);
        const destination=new URL('https://accounts.google.com/o/oauth2/v2/auth');
        destination.search=new URLSearchParams({client_id:config.clientId,response_type:'code',redirect_uri:config.origin+'/auth/google/callback',scope:'openid email profile',state,nonce,code_challenge:challenge(verifier),code_challenge_method:'S256',prompt:'select_account'}).toString();
        const result=redirect(destination.href);result.headers.append('Set-Cookie',cookie(stateCookie,binding,600));return result;
      }
      if(path==='/auth/google/callback'&&method==='GET'){
        if(!config.ready)throw new AccessError('not_configured',503);rate(remoteAddress);
        const state=url.searchParams.get('state'),binding=cookies(request)[stateCookie];
        if(!opaquePattern.test(state||'')||!opaquePattern.test(binding||''))throw new AccessError('invalid_state',400);
        const saved=db.prepare('DELETE FROM states WHERE id=? AND binding=? AND expires>? RETURNING nonce,verifier').get(hash(state),hash(binding),now());
        if(!saved)throw new AccessError('invalid_state',400);
        if(url.searchParams.has('error'))throw new AccessError('consent_cancelled');
        const code=url.searchParams.get('code');if(!code||code.length>4096)throw new AccessError('invalid_request',400);
        let claims;try{claims=await google.exchange(code,saved.verifier);}catch{throw new AccessError('verification_unavailable',503);}
        const identity=googleIdentity(claims,saved.nonce);
        // No await within this transaction: concurrent block/approval cannot be lost.
        let status;
        try{status=transaction(()=>upsertIdentity(identity));}catch(error){
          if(['blocked','account_mismatch'].includes(error.reason))audit('access_denied',identity.email,null,error.reason);
          throw error;
        }
        const raw=random(),sid=hash(raw);
        db.prepare('INSERT INTO sessions(id,user_sub,expires,csrf,created) VALUES(?,?,?,?,?)').run(sid,identity.sub,now()+SESSION_LIFETIME,random(),now());
        db.prepare('DELETE FROM sessions WHERE user_sub=? AND id<>? AND id NOT IN (SELECT id FROM sessions WHERE user_sub=? AND id<>? ORDER BY created DESC,id DESC LIMIT 4)').run(identity.sub,sid,identity.sub,sid);
        const previous=cookies(request)[sessionCookie];if(opaquePattern.test(previous||''))db.prepare('DELETE FROM sessions WHERE id=?').run(hash(previous));
        audit('login',identity.email,null,status==='approved'?'approved':'pending_approval');
        const result=redirect(status==='approved'?'/':'/access');result.headers.append('Set-Cookie',cookie(stateCookie,''));result.headers.append('Set-Cookie',cookie(sessionCookie,raw,SESSION_LIFETIME/1000));return result;
      }
      if(['/access','/login','/login.html'].includes(path)&&method==='GET'){
        let user=null,reason=config.ready?'sign_in_required':'not_configured';
        try{user=currentUser(request,{requireApproval:false});reason=user.status==='approved'?'approved':'pending_approval';}catch(error){reason=error.reason||'verification_unavailable';}
        return response(accessPage(reason,user,config.ready));
      }
      if(path==='/api/session'&&method==='GET'){
        const user=currentUser(request,{requireApproval:false});return json({sub:user.sub,email:user.email,name:user.name,status:user.status,isOwner:user.isOwner,csrf:user.csrf});
      }
      if(path==='/api/logout'&&method==='POST'){
        const user=currentUser(request,{requireApproval:false});csrf(request,user);
        db.prepare('DELETE FROM sessions WHERE id=?').run(user.sessionId);audit('logout',user.email);
        const result=json({ok:true});result.headers.append('Set-Cookie',cookie(sessionCookie,''));return result;
      }
      if(path==='/admin'&&method==='GET'){const user=currentUser(request,{admin:true});return response(adminPage(user));}
      if(path==='/admin/help'&&method==='GET'){currentUser(request,{admin:true});return response(helpPage());}
      if(path==='/admin.js'&&method==='GET'){currentUser(request,{admin:true});return file(path);}
      if(path==='/api/admin'&&method==='GET'){
        currentUser(request,{admin:true});
        const query=(url.searchParams.get('q')||'').trim().toLowerCase().slice(0,100);
        const offset=Math.max(0,Math.min(1000000,Number.parseInt(url.searchParams.get('offset')||'0',10)||0));
        const tab=['grants','requests','audit'].includes(url.searchParams.get('tab'))?url.searchParams.get('tab'):'grants';
        let rows,total;
        if(tab==='grants'){
          rows=db.prepare('SELECT g.*,u.name,u.last_login FROM grants g LEFT JOIN users u ON u.sub=g.sub WHERE instr(g.email,?)>0 ORDER BY g.updated DESC,g.id DESC LIMIT 25 OFFSET ?').all(query,offset);
          total=db.prepare('SELECT COUNT(*) AS n FROM grants WHERE instr(email,?)>0').get(query).n;
        }else if(tab==='requests'){
          rows=db.prepare("SELECT sub,email,name,authoritative,status,last_login FROM users WHERE status='pending' AND instr(email,?)>0 ORDER BY last_login DESC,sub LIMIT 25 OFFSET ?").all(query,offset);
          total=db.prepare("SELECT COUNT(*) AS n FROM users WHERE status='pending' AND instr(email,?)>0").get(query).n;
        }else{
          rows=db.prepare('SELECT id,at,event,actor,target,reason FROM audit WHERE instr(lower(coalesce(actor,\'\')||\' \'||coalesce(target,\'\')),?)>0 ORDER BY id DESC LIMIT 25 OFFSET ?').all(query,offset);
          total=db.prepare('SELECT COUNT(*) AS n FROM audit WHERE instr(lower(coalesce(actor,\'\')||\' \'||coalesce(target,\'\')),?)>0').get(query).n;
        }
        return json({tab,rows,total,offset,limit:25,ownerEmail:config.ownerEmail,counts:{approved:db.prepare("SELECT COUNT(*) AS n FROM grants WHERE status='approved'").get().n,blocked:db.prepare("SELECT COUNT(*) AS n FROM grants WHERE status='blocked'").get().n,pending:db.prepare("SELECT COUNT(*) AS n FROM users WHERE status='pending'").get().n}});
      }
      if(path==='/api/admin/emails'&&method==='POST'){
        const actor=currentUser(request,{admin:true});csrf(request,actor);rate('admin:'+actor.sub);
        const body=await bodyJSON(request),email=normalizeEmail(body.email);if(!email)throw new AccessError('invalid_email',400);
        if(email===config.ownerEmail)throw new AccessError('owner_protected',400);
        transaction(()=>{
          const existing=db.prepare('SELECT * FROM grants WHERE email=?').get(email);
          db.prepare("INSERT INTO grants(email,status,created,updated) VALUES(?,'approved',?,?) ON CONFLICT(email) DO UPDATE SET status='approved',updated=excluded.updated").run(email,now(),now());
          if(existing?.sub)db.prepare("UPDATE users SET status='approved' WHERE sub=? AND email=?").run(existing.sub,email);
          if(!existing?.sub){
            const known=db.prepare("SELECT sub FROM users WHERE email=? AND authoritative=1 AND status<>'blocked'").all(email);
            if(known.length===1){
              db.prepare('UPDATE grants SET sub=? WHERE email=? AND sub IS NULL').run(known[0].sub,email);
              db.prepare("UPDATE users SET status='approved' WHERE sub=?").run(known[0].sub);
            }
          }
          audit('email_allowed',actor.email,email);
        });
        return json({ok:true});
      }
      const grantPath=path.match(/^\/api\/admin\/grants\/(\d+)$/);
      if(grantPath&&method==='POST'){
        const actor=currentUser(request,{admin:true});csrf(request,actor);rate('admin:'+actor.sub);
        const body=await bodyJSON(request);if(!['approve','block'].includes(body.action))throw new AccessError('invalid_request',400);
        const grant=db.prepare('SELECT * FROM grants WHERE id=?').get(grantPath[1]);if(!grant)throw new AccessError('not_found',404);
        if(grant.email===config.ownerEmail||grant.sub===ownerSub())throw new AccessError('owner_protected',400);
        transaction(()=>{
          const status=body.action==='approve'?'approved':'blocked';
          db.prepare('UPDATE grants SET status=?,updated=? WHERE id=?').run(status,now(),grant.id);
          if(grant.sub){
            db.prepare('UPDATE users SET status=? WHERE sub=?').run(status,grant.sub);
            if(status==='blocked'){db.prepare('DELETE FROM sessions WHERE user_sub=?').run(grant.sub);db.prepare("UPDATE grants SET status='blocked',updated=? WHERE sub=?").run(now(),grant.sub);}
          }
          audit(body.action==='approve'?'access_approved':'access_blocked',actor.email,grant.email);
        });return json({ok:true});
      }
      const userPath=path.match(/^\/api\/admin\/users\/([A-Za-z0-9_-]{6,255})$/);
      if(userPath&&method==='POST'){
        const actor=currentUser(request,{admin:true});csrf(request,actor);rate('admin:'+actor.sub);
        const body=await bodyJSON(request);if(!['approve','block'].includes(body.action))throw new AccessError('invalid_request',400);
        transaction(()=>{
          const sub=userPath[1],target=db.prepare('SELECT * FROM users WHERE sub=?').get(sub);if(!target)throw new AccessError('not_found',404);
          if(sub===ownerSub()||target.email===config.ownerEmail)throw new AccessError('owner_protected',400);
          if(body.action==='approve')approveUser(sub,actor.email);
          else{
            const grant=db.prepare('SELECT sub FROM grants WHERE email=?').get(target.email);
            if(!grant||!grant.sub||grant.sub===sub)db.prepare("INSERT INTO grants(email,sub,status,created,updated) VALUES(?,?,'blocked',?,?) ON CONFLICT(email) DO UPDATE SET sub=excluded.sub,status='blocked',updated=excluded.updated").run(target.email,sub,now(),now());
            db.prepare("UPDATE users SET status='blocked' WHERE sub=?").run(sub);
            db.prepare("UPDATE grants SET status='blocked',updated=? WHERE sub=?").run(now(),sub);
            db.prepare('DELETE FROM sessions WHERE user_sub=?').run(sub);audit('access_blocked',actor.email,target.email);
          }
        });return json({ok:true});
      }
      if(protectedFiles.has(path)&&['GET','HEAD'].includes(method))return file(path,currentUser(request));
      return response(page('Страница не найдена','<section class="simple-card"><h1>Здесь пока пусто</h1><p>Вернись к справочнику или странице входа.</p><a class="auth-secondary" href="/access">Ко входу</a></section>'),404);
    }catch(error){
      const known=error instanceof AccessError,reason=known?error.reason:'verification_unavailable',status=known?error.status:503;
      if(path.startsWith('/api/'))return json({error:reason},status);
      const result=response(accessPage(reason,null,config.ready),status);
      if(path==='/auth/google/callback')result.headers.append('Set-Cookie',cookie(stateCookie,''));
      return result;
    }
  }
  return {handle,close(){db.close();buckets.clear();}};
}
