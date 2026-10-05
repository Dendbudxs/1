import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { readConfig } from './access-store.mjs';
import { createApplication } from './application.mjs';
const config=readConfig(),app=createApplication(config);
if(!app.store.db.prepare('SELECT id FROM access_users WHERE email=? AND role=?').get(config.ownerEmail,'owner')){
  app.close();throw Error('Сначала создайте владельца командой npm run owner. Сайт пока закрыт.');
}
const port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Неверный PORT.');
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,config.origin);
    if(url.origin!==config.origin)throw Error('Invalid request origin');
    const headers=new Headers();for(const [name,value] of Object.entries(req.headers)){if(Array.isArray(value))value.forEach(v=>headers.append(name,v));else if(value!==undefined)headers.set(name,value);}
    const request=new Request(url,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
    const response=await app.handle(request,{ip:req.socket.remoteAddress||'unknown'});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    if(!response.body||req.method==='HEAD')res.end();else Readable.fromWeb(response.body).pipe(res);
  }catch{res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('Неверный запрос.');}
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(port,host,()=>console.log('Mandarin Medium RP 1.13 · '+config.origin));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{app.close();process.exit(0);}));
