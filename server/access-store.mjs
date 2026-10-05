import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const derive=promisify(scrypt), options={N:32768,r:8,p:1,maxmem:64*1024*1024};
export const secret=()=>randomBytes(32).toString('base64url');
export const hash=value=>createHash('sha256').update(String(value)).digest('hex');
export const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export const emailOf=value=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())?value.trim().toLowerCase():'';
export function validPassword(password){return typeof password==='string'&&password.length>=12&&Buffer.byteLength(password)<=256;}
export async function passwordHash(password){
  if(!validPassword(password))throw Error('Пароль должен содержать от 12 символов до 256 байт.');
  const salt=randomBytes(16).toString('hex');
  return 'scrypt$'+salt+'$'+Buffer.from(await derive(password,salt,64,options)).toString('hex');
}
export async function passwordMatches(password,stored){
  if(typeof password!=='string'||Buffer.byteLength(password)>256)return false;
  const [kind,salt,key]=String(stored).split('$');
  if(kind!=='scrypt'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(key))return false;
  return equal(Buffer.from(await derive(password,salt,64,options)).toString('hex'),key);
}
export function readConfig(env=process.env){
  const url=new URL(env.APP_URL||'http://127.0.0.1:8787');
  const local=url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname);
  if((url.protocol!=='https:'&&!local)||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw Error('APP_URL: нужен HTTPS-адрес без пути, либо локальный http://127.0.0.1.');
  const ownerEmail=emailOf(env.OWNER_EMAIL||'amurtigered@gmail.com');
  if(!ownerEmail)throw Error('OWNER_EMAIL: неверная почта владельца.');
  return {origin:url.origin,secure:!local,ownerEmail,dbPath:resolve(env.AUTH_DB_PATH||'private-data/access.sqlite')};
}
export function openStore(config,{dbPath=config.dbPath,now=Date.now}={}){
  if(dbPath!==':memory:')mkdirSync(dirname(dbPath),{recursive:true,mode:0o700});
  const db=new DatabaseSync(dbPath);
  if(dbPath!==':memory:')chmodSync(dbPath,0o600);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS access_users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner','admin','member')),
    status TEXT NOT NULL CHECK(status IN ('approved','blocked')),
    password_hash TEXT NOT NULL, must_change INTEGER NOT NULL DEFAULT 1,
    temporary_expires INTEGER, created INTEGER NOT NULL, last_login INTEGER
  );
  CREATE TABLE IF NOT EXISTS access_sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES access_users(id),
    csrf TEXT NOT NULL, expires INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS access_sessions_user ON access_sessions(user_id);
  CREATE TABLE IF NOT EXISTS access_audit (
    id INTEGER PRIMARY KEY, at INTEGER NOT NULL, event TEXT NOT NULL,
    actor TEXT NOT NULL, target TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS access_meta (name TEXT PRIMARY KEY,value TEXT NOT NULL);`);
  const binding=hash(config.origin+'\n'+config.ownerEmail);
  const current=db.prepare('SELECT value FROM access_meta WHERE name=?').get('binding');
  if(current&&current.value!==binding){db.close();throw Error('Эта база привязана к другому адресу или владельцу. Сохраните прежнюю конфигурацию.');}
  db.prepare('INSERT OR IGNORE INTO access_meta(name,value) VALUES(?,?)').run('binding',binding);
  const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}};
  const audit=(event,actor,target)=>db.prepare('INSERT INTO access_audit(at,event,actor,target) VALUES(?,?,?,?)').run(now(),event,actor,target);
  const publicUser=u=>({id:u.id,email:u.email,name:u.name,role:u.role,status:u.status,mustChange:Boolean(u.must_change),created:u.created,lastLogin:u.last_login});
  function user(id){return db.prepare('SELECT * FROM access_users WHERE id=?').get(id);}
  function session(token){
    if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))return null;
    return db.prepare('SELECT s.token_hash,s.csrf,s.expires,u.* FROM access_sessions s JOIN access_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>? AND u.status=? AND (u.temporary_expires IS NULL OR u.temporary_expires>?)').get(hash(token),now(),'approved',now())||null;
  }
  function createSession(u){
    const token=secret(),csrf=secret(),expires=now()+7*86400000;
    db.prepare('DELETE FROM access_sessions WHERE expires<=?').run(now());
    db.prepare('INSERT INTO access_sessions(token_hash,user_id,csrf,expires) VALUES(?,?,?,?)').run(hash(token),u.id,csrf,expires);
    // Keep the newest eight sessions for an account.
    db.prepare('DELETE FROM access_sessions WHERE user_id=? AND token_hash NOT IN (SELECT token_hash FROM access_sessions WHERE user_id=? ORDER BY expires DESC LIMIT 8)').run(u.id,u.id);
    return {token,csrf,expires};
  }
  async function createOwner(password){
    if(db.prepare('SELECT id FROM access_users WHERE role=? OR email=?').get('owner',config.ownerEmail))throw Error('Владелец уже создан. Его пароль не будет перезаписан.');
    const encoded=await passwordHash(password),id=secret();
    tx(()=>{db.prepare('INSERT INTO access_users(id,email,name,role,status,password_hash,must_change,created) VALUES(?,?,?,?,?,?,?,?)').run(id,config.ownerEmail,'Владелец','owner','approved',encoded,0,now());audit('owner_created',config.ownerEmail,config.ownerEmail);});
    return publicUser(user(id));
  }
  return {db,tx,audit,user,session,createSession,createOwner,publicUser,close:()=>db.close()};
}
