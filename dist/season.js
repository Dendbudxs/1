(function () {
  'use strict';
  const field=document.getElementById('snowfall');
  const button=document.getElementById('snow-toggle');
  const label=document.getElementById('snow-label');
  if(!field||!button||!label)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let preference=null;
  try { preference=localStorage.getItem('mandarin-snow'); } catch {}
  let enabled=preference!=='off';
  // Three particle depths, with a bounded field and no animation render loop.
  field.innerHTML=Array.from({length:76},(_,i)=>{
    const crystal=i%9===0, near=i%7===0;
    const left=(i*37.79)%100, size=crystal?13+(i%4):near?8:3+(i%5)*.8;
    const duration=14+(i%17), delay=-((i*5.73)%31), drift=((i%5)-2)*30;
    return `<span class="snowflake ${crystal?'snow-crystal':''}" style="--left:${left.toFixed(2)}%;--size:${size}px;--duration:${duration}s;--delay:${delay.toFixed(2)}s;--drift:${drift}px;--blur:${near&&!crystal?.7:0}px;--opacity:${(crystal?.35:0.22+(i%4)*.07).toFixed(2)}">${crystal?'❄':''}</span>`;
  }).join('');
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('snow-visible',entry.isIntersecting));
  },{rootMargin:'60px'});
  const controls='.section-tab,.home-link,.shelf-tab,.topic-tab,.guide-nav-link,.category-choice,.filter-pill,.copy-button,.outline-button,.subtle-button,.icon-button,.word-button,.snow-toggle,.category-picker,.select-control,.hint-button,.reader-top,.round-tab,.variant-tab,.record-more,.admin-open';
  function observeCards(){
    document.querySelectorAll(controls).forEach((control,i)=>{
      if(!control.classList.contains('frost-control')){
        control.classList.add('frost-control');
        control.style.setProperty('--snow-delay',`${-((i*1.31)%4.6).toFixed(2)}s`);
      }
    });
    observer?.disconnect();
    document.querySelectorAll('.snowy-card,.frost-control,.round-card').forEach(card=>{
      card.classList.toggle('snow-visible',!observer);
      observer?.observe(card);
    });
  }
  const view=document.getElementById('view');
  if(view&&typeof MutationObserver!=='undefined')new MutationObserver(observeCards).observe(view,{childList:true,subtree:true});
  observeCards();
  function update(){
    const active=enabled&&!reduced.matches;
    field.hidden=!active;
    field.classList.toggle('is-paused',document.hidden);
    document.body.classList.toggle('snow-disabled',!active);
    document.body.classList.toggle('snow-paused',document.hidden);
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',active?'Выключить падающий снег':'Включить падающий снег');
    button.disabled=reduced.matches;
    button.title=reduced.matches?'Анимация отключена в настройках устройства':active?'Выключить падающий снег':'Включить падающий снег';
    label.textContent=active?'Снег':'Без снега';
  }
  button.addEventListener('click',()=>{
    enabled=!enabled;
    try {localStorage.setItem('mandarin-snow',enabled?'on':'off');} catch {}
    update();
  });
  reduced.addEventListener?.('change',update);
  document.addEventListener('visibilitychange',update);
  update();
})();
