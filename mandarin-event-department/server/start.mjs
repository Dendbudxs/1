import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createApplication,readConfig } from './auth.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const config=readConfig();
const port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be between 1 and 65535.');
const app=createApplication(config,{siteDir:resolve(root,'dist')});
const server=createServer({maxHeaderSize:16384,requestTimeout:30000,headersTimeout:15000},async(incoming,outgoing)=>{
  try{
    if(!incoming.url?.startsWith('/')||incoming.url.startsWith('//')){outgoing.writeHead(400);outgoing.end();return;}
    const headers=new Headers();
    for(const [name,value] of Object.entries(incoming.headers))if(value!==undefined)headers.set(name,Array.isArray(value)?value.join('; '):value);
    const method=incoming.method||'GET';
    const init={method,headers};
    if(!['GET','HEAD'].includes(method)){init.body=Readable.toWeb(incoming);init.duplex='half';}
    const request=new Request(config.origin+incoming.url,init);
    const response=await app.handle(request,{remoteAddress:incoming.socket.remoteAddress||'unknown'});
    outgoing.statusCode=response.status;
    for(const [name,value] of response.headers)if(name!=='set-cookie')outgoing.setHeader(name,value);
    const cookies=response.headers.getSetCookie();if(cookies.length)outgoing.setHeader('Set-Cookie',cookies);
    if(method==='HEAD'){outgoing.end();return;}
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  }catch{
    // Never log request URLs: OAuth callbacks contain one-time authorization codes.
    if(!outgoing.headersSent)outgoing.writeHead(500,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
    outgoing.end('Не удалось обработать запрос.');
  }
});
server.maxConnections=256;
server.listen(port,host,()=>{
  console.log('Справочник запущен: '+host+':'+port+'. '+(config.ready?'Google настроен.':'Материалы закрыты: заполните настройки в .env.'));
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{app.close();process.exit(0);}));
