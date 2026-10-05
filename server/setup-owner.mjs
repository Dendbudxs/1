import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { readConfig,openStore,validPassword } from './access-store.mjs';

if(!process.stdin.isTTY||!process.stdout.isTTY)throw Error('Запустите npm run owner в интерактивном терминале. Пароль не передаётся в аргументах.');
const config=readConfig(),store=openStore(config);
let muted=false;
const output=new Writable({write(chunk,encoding,done){if(!muted)process.stdout.write(chunk,encoding);done();}});
const rl=createInterface({input:process.stdin,output,terminal:true});
async function hidden(question){process.stdout.write(question);muted=true;try{return await rl.question('');}finally{muted=false;process.stdout.write('\n');}}
try{
  console.log('Первый владелец: '+config.ownerEmail);
  const password=await hidden('Задайте пароль (не менее 12 символов): ');
  const confirmation=await hidden('Повторите пароль: ');
  if(password!==confirmation||!validPassword(password))throw Error('Пароли должны совпадать и содержать минимум 12 символов, максимум 256 байт.');
  await store.createOwner(password);
  console.log('Владелец создан. Теперь можно запустить npm start и войти на сайт.');
}finally{rl.close();store.close();}
