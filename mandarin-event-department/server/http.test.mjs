import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync,mkdirSync,rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

test('Node HTTP launcher stays closed without configuration and serves HEAD without a body',async t=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');
  const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  const base=resolve(root,'private-data');mkdirSync(base,{recursive:true});
  const temporary=mkdtempSync(resolve(base,'test-http-'));
  const server=spawn(process.execPath,['server/start.mjs'],{cwd:root,stdio:['ignore','pipe','pipe'],env:{...process.env,APP_URL:'http://127.0.0.1:'+port,HOST:'127.0.0.1',PORT:String(port),GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',OWNER_GOOGLE_EMAIL:'',AUTH_DB_PATH:resolve(temporary,'auth.sqlite')}});
  t.after(async()=>{if(server.exitCode===null){const exit=once(server,'exit');server.kill('SIGTERM');await exit;}rmSync(temporary,{recursive:true,force:true});});
  await Promise.race([once(server.stdout,'data'),once(server,'exit').then(()=>{throw Error('HTTP server did not start.');}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out.')),5000);timer.unref();})]);
  const origin='http://127.0.0.1:'+port;
  const health=await fetch(origin+'/healthz');assert.equal(health.status,200);assert.deepEqual(await health.json(),{ok:true});
  const healthHead=await fetch(origin+'/healthz',{method:'HEAD'});assert.equal(healthHead.status,200);assert.equal(await healthHead.text(),'');
  for(const path of ['/','/data.js','/catalog.js','/departments.js','/app.js','/api/admin']){
    const r=await fetch(origin+path);assert.equal(r.status,503,path);assert.match(r.headers.get('cache-control'),/no-store/);
  }
  const head=await fetch(origin+'/data.js',{method:'HEAD'});assert.equal(head.status,503);assert.equal(await head.text(),'');
  assert.equal((await fetch(origin+'/.env')).status,404);
  assert.equal((await fetch(origin+'/auth.css')).status,200);
  assert.match(await (await fetch(origin+'/access')).text(),/скоро будет доступен/);
});
