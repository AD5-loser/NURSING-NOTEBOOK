let route={v:'home'};
const $=id=>document.getElementById(id);
const hasPapers=s=>Object.keys(s.papers).length>0;
const yearLive=y=>y.subjects.some(hasPapers);
function go(r){route=r;render();window.scrollTo({top:0,behavior:'smooth'})}
function crumbs(){
  const c=$('crumbs');if(route.v==='home'){c.style.display='none';return}
  c.style.display='block';const y=PROGRAM[route.y],s=y&&y.subjects[route.s];
  let h='<button onclick="go({v:\'home\'})">B.Sc. in Nursing</button>';
  if(route.v==='year')h+=' › <b>'+y.label+'</b>';
  if(route.v==='subject')h+=' › <button onclick="go({v:\'year\',y:'+route.y+'})">'+y.label+'</button> › <b>'+s.name+'</b>';
  c.firstElementChild.innerHTML=h;
}
function render(){
  crumbs();const el=$('content');
  if(route.v==='home'){
    const total=PROGRAM.reduce((a,y)=>a+y.subjects.reduce((b,s)=>b+Object.values(s.papers).reduce((c,p)=>c+Object.keys(p).length,0),0),0);
    el.innerHTML=`<section class="hero"><h1>B.Sc. in Nursing</h1><p>Past board exam questions organized by academic year and subject, for quick and focused revision.</p>
    <div class="stats"><span class="stat">${total} question papers</span><span class="stat">${UNIVERSITY}</span></div></section>
    <div class="grid">${PROGRAM.map((y,i)=>`<button class="card" onclick="go({v:'year',y:${i}})"><span><span class="t">${y.label}</span><span class="s">${y.subjects.length} subjects</span></span><span class="pill ${yearLive(y)?'live':'soon'}">${yearLive(y)?'Available':'Coming soon'}</span></button>`).join('')}</div>
    ${donate()}`;return}
  if(route.v==='year'){
    const y=PROGRAM[route.y];
    el.innerHTML=`<h2>${y.label}</h2><p style="color:var(--soft)">Select a subject to view its questions.</p>`+
    (yearLive(y)?`<div class="grid">${y.subjects.map((s,i)=>`<button class="card" onclick="go({v:'subject',y:${route.y},s:${i}})"><span><span class="t">${s.name}</span><span class="s">${s.code}</span></span><span class="pill ${hasPapers(s)?'live':'soon'}">${hasPapers(s)?Object.keys(s.papers).length+' yrs':'Soon'}</span></button>`).join('')}</div>`:
    `<div class="empty"><h3>Coming soon</h3><p>Question papers for this year have not been added yet.</p></div>`);return}
  const y=PROGRAM[route.y],s=y.subjects[route.s];
  el.innerHTML=`<h2>${s.name}</h2><p style="color:var(--soft)">${s.code} · Select a year to open the Written or MCQ paper.</p><div class="list">`+
  EXAM_YEARS.map(e=>{const p=s.papers[e];
    const o=p?`${p.written?`<a class="btn" target="_blank" rel="noopener" href="${p.written}">Written</a>`:''}${p.mcq?`<a class="btn" target="_blank" rel="noopener" href="${p.mcq}">MCQ</a>`:''}`:`<span style="color:var(--soft);font-size:.88rem">This paper has not been added yet.</span>`;
    return `<div class="row" id="r${e}"><button onclick="tog(${e})"><span class="yr">${e}</span><span class="pill ${p?'live':'soon'}">${p?'Available':'Coming soon'}</span></button><div class="opts">${o}</div></div>`}).join('')+'</div>';
}
function tog(e){const r=$('r'+e),w=r.classList.contains('open');document.querySelectorAll('.row.open').forEach(x=>x.classList.remove('open'));if(!w)r.classList.add('open')}
function donate(){return `<section class="donate" aria-label="Donate / Support"><h2>Donate / Support</h2>
<p>Education should be free and accessible to every nursing student. This archive is maintained voluntarily, and every contribution helps keep the archive updated.</p>
<div class="pay"><span>bKash / Nagad (Send Money)</span><code id="num">${PAY_NUMBER}</code><button class="copy" id="cp" onclick="copyNum()" aria-label="Copy payment number">Copy</button></div></section>`}
function copyNum(){const b=$('cp');
  const done=()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',1800)};
  if(navigator.clipboard)navigator.clipboard.writeText(PAY_NUMBER).then(done).catch(()=>{b.textContent='Copy failed'});else b.textContent='Copy failed'}
const PAY_NUMBER='01XXXXXXXXX'; // TODO: replace with your real bKash/Nagad number
render();
