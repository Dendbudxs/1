(() => {
  'use strict';
  const canvas=document.getElementById('snow');
  const button=document.getElementById('snow-toggle');
  const ctx=canvas.getContext('2d');
  if(!ctx){button.hidden=true;return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let stored=null;
  try{stored=localStorage.getItem('mandarin-snow');}catch{}
  let enabled=stored===null?!reduced.matches:stored==='on';
  let frame=0,previous=0,width=0,height=0,flakes=[];
  function resize(){
    width=window.innerWidth;height=window.innerHeight;
    const ratio=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.floor(width*ratio);canvas.height=Math.floor(height*ratio);
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    ctx.setTransform(ratio,0,0,ratio,0,0);
    const count=width<600?74:Math.max(90,Math.min(180,Math.round(width*height/7800)));
    flakes=Array.from({length:count},()=>{
      const depth=Math.random();
      return {
        x:Math.random()*width,y:Math.random()*height,
        r:0.65+depth*2.45,speed:16+depth*30,
        opacity:0.22+depth*0.46,drift:5+depth*12,phase:Math.random()*Math.PI*2
      };
    });
  }
  function draw(time){
    frame=0;
    if(!enabled||document.hidden)return;
    const dt=previous?Math.min((time-previous)/1000,0.05):0;previous=time;
    ctx.clearRect(0,0,width,height);
    for(const f of flakes){
      f.y+=f.speed*dt;f.x+=(4+Math.sin(time/3200+f.phase)*f.drift)*dt;
      if(f.y>height+4){f.y=-4;f.x=Math.random()*width;}
      if(f.x>width+4)f.x=-4;
      if(f.x< -4)f.x=width+4;
      ctx.fillStyle='rgba(255,251,244,'+f.opacity+')';
      ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();
    }
    frame=requestAnimationFrame(draw);
  }
  function sync(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;previous=0;
    canvas.hidden=!enabled||document.hidden;
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',enabled?'Выключить падающий снег':'Включить падающий снег');
    button.title=enabled?'Выключить снег':'Включить снег';
    if(enabled&&!document.hidden)frame=requestAnimationFrame(draw);
  }
  button.addEventListener('click',()=>{
    enabled=!enabled;
    try{localStorage.setItem('mandarin-snow',enabled?'on':'off');}catch{}
    sync();
  });
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('resize',resize);
  reduced.addEventListener('change',event=>{
    if(event.matches){enabled=false;sync();}
  });
  resize();sync();
})();
