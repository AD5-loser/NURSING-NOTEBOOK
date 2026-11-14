const T=(n,p)=>window.nnbTrack&&window.nnbTrack(n,p);
const $=s=>document.querySelector(s),RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
let qy=0,qs='',open=new Set(),lots=[];
const cnt=s=>Object.values(s.papers).reduce((a,p)=>a+p.length,0);
const ycnt=y=>y.subjects.reduce((a,s)=>a+cnt(s),0);
const total=PROGRAM.reduce((a,y)=>a+ycnt(y),0);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function lot(id,key,loop=true){const c=document.getElementById(id);if(!c||!window.lottie||!ANIMATIONS[key])return;
  lots.push(lottie.loadAnimation({container:c,renderer:'svg',loop,autoplay:!RM,animationData:ANIMATIONS[key]}))}
function reveal(){const io=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.12});
  document.querySelectorAll('.rv').forEach((el,i)=>{el.style.setProperty('--i',i%6);io.observe(el)})}
function counters(){document.querySelectorAll('[data-n]').forEach(el=>{const n=+el.dataset.n;if(RM){el.textContent=n;return}let t0;
  const f=t=>{t0=t0||t;const p=Math.min((t-t0)/900,1);el.textContent=Math.round(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function social(){const l=[];if(CONTACT.facebook)l.push(`<a href="${esc(CONTACT.facebook)}" target="_blank" rel="noopener">Facebook</a>`);
  if(CONTACT.telegram)l.push(`<a href="${esc(CONTACT.telegram)}" target="_blank" rel="noopener">Telegram</a>`);
  if(CONTACT.email)l.push(`<a href="mailto:${esc(CONTACT.email)}">Email</a>`);return `<div class="soc">${l.join('')}</div>`}
function tgd(){const v=$('#ds').classList.toggle('show');$('#dt').setAttribute('aria-expanded',v);if(v)T('donate_open',{location:'home'})}
function donate(){return `<section class="donate rv"><button class="b-cof" id="dt" onclick="tgd()" aria-expanded="false" aria-controls="ds">☕ Buy the Backbencher a singara</button>
<div class="dsec" id="ds"><div class="sdiv"></div><p class="dh">Your money is safe. Probably. 🥱</p><p>This archive is free, and I'm not planning to become rich from question papers.</p><p class="dhelp">Spotted a wrong question or a missing paper? Help me fix it. Contact me:</p>${social()}</div></section>`}
function paperBtns(list,s,e,yi){return list.map(q=>`<a class="pb ${q.t==='MCQ'?'m':''}" data-code="${s.code}" data-subject="${esc(s.name)}" data-year="${e}" data-type="${q.t}" data-set="${esc(q.s||'')}" data-ay="${esc(PROGRAM[yi].label)}" target="_blank" rel="noopener" href="${esc(q.l)}">${q.t}${q.s?' '+q.s.replace('Set ',''):''}</a>`).join('')}
function subjHtml(s,yi,si,i){const id=yi+'-'+si,o=open.has(id),n=cnt(s);
  const rows=s.new?'<div class="yr"><span class="na">New subject. No previous question papers exist.</span></div>':EXAM_YEARS.map(e=>{const p=s.papers[e];return `<div class="yr"><b>${e}</b><div class="bt">${p?paperBtns(p,s,e,yi):'<span class="na">Coming soon</span>'}</div></div>`}).join('');
  return `<div class="acc ${o?'open':''}" id="a${id}" style="--i:${i}"><button onclick="tg('${id}')" aria-expanded="${o}"><span class="nm">${esc(s.name)}<span class="cd"><i class="dot c${s.code[2]}"></i>${s.code} · ${CAT[s.code[2]]} Subject</span></span><span class="pill ${s.new?'nw':n?'live':'soon'}">${s.new?'New':n?n+' papers':'Soon'}</span><span class="chev">›</span></button><div class="body"><div>${rows}</div></div></div>`}
function tg(id){open.has(id)?open.delete(id):open.add(id);if(open.has(id)){const k=id.split('-'),s=PROGRAM[k[0]].subjects[k[1]];T('subject_open',{subject_code:s.code,subject_name:s.name,academic_year:PROGRAM[k[0]].label})}const a=document.getElementById('a'+id);a.classList.toggle('open');a.firstElementChild.setAttribute('aria-expanded',open.has(id))}
function list(){const q=qs.trim().toLowerCase();let h='',i=0;
  PROGRAM.forEach((y,yi)=>{if(!q&&yi!==qy)return;y.subjects.forEach((s,si)=>{if(q&&!(s.name.toLowerCase().includes(q)||s.code.toLowerCase().includes(q)))return;h+=subjHtml(s,yi,si,i++)})});
  if(!h)return `<div class="empty"><div class="lot" id="l-empty" style="width:150px"></div><p>No subjects found. Try another name or code.</p></div>`;
  return h}
function setList(){$('#list').innerHTML=list();lot('l-empty','medicalCare')}
function view(r,p){lots.forEach(l=>l.destroy());lots=[];const el=$('#app');let h='';
  if(r==='home'){h=`<div class="page"><section class="hero"><h1>RMU B.Sc. Nursing Question Bank</h1><p>Past board exam papers, Written and MCQ, organized by year and subject. Open any paper in two taps.</p><div class="lot" id="l-hero"></div><a class="cta" href="#questions">Browse Questions →</a></section>
<div class="stats"><div class="stat rv"><b data-n="${total}">0</b><span>Papers</span></div><div class="stat rv"><b data-n="${PROGRAM.reduce((a,y)=>a+y.subjects.filter(x=>cnt(x)).length,0)}">0</b><span>Subjects</span></div><div class="stat rv"><b data-n="${EXAM_YEARS.length}">0</b><span>Exam years</span></div></div>
<h2 class="sec rv">Jump to your year</h2><div class="yg">${PROGRAM.map((y,i)=>`<a class="yc y${i} rv" href="#questions/${i}"><b>${y.label}</b><small>${ycnt(y)?ycnt(y)+' papers':'Coming soon'}</small></a>`).join('')}</div>
<h2 class="sec rv">How it works</h2><div class="steps"><div class="step rv"><i>1</i>Pick your year</div><div class="step rv"><i>2</i>Tap a subject</div><div class="step rv"><i>3</i>Open Written or MCQ</div></div>${donate()}</div>`}
  else if(r==='questions'){if(p!==undefined&&PROGRAM[p])qy=+p;
    h=`<div class="page"><h2>Question Papers</h2><p class="sub">${UNIVERSITY}</p><div style="height:12px"></div>
<input class="search" id="q" type="search" placeholder="Search subject or code (e.g. Anatomy, B124)" aria-label="Search subjects" value="${esc(qs)}">
<details class="f"><summary>How subject codes work</summary><p><b>B</b> = B.Sc. in Nursing. Digit 1 = year of study. Digit 2 = type (1 General, 2 Foundational, 3 Professional). Digit 3 = serial number in that year. Example: <b>B124</b> = 1st Year, Foundational, 4th subject (Anatomy).</p></details><div class="tabs" role="tablist">${PROGRAM.map((y,i)=>`<button role="tab" class="${i===qy?'on':''}" onclick="sy(${i})">${y.label.replace(' Year','')}</button>`).join('')}</div><div id="list"></div></div>`}
  else{location.replace('about.html');return}
  el.innerHTML=h;T('view_section',{section:r,academic_year:r==='questions'?PROGRAM[qy].label:''});if(r==='home')lot('l-hero','graduation');
  if(r==='questions'){setList();$('#q').oninput=e=>{qs=e.target.value;setList();clearTimeout(window._qt);const t=qs.trim().toLowerCase();if(t.length>=2)window._qt=setTimeout(()=>T('search',{search_term:t.slice(0,60)}),900)}}
  document.querySelectorAll('[data-r]').forEach(a=>a.classList.toggle('on',a.dataset.r===r));
  reveal();counters()}
function sy(i){qy=i;qs='';location.hash='questions/'+i}
function route(){if(location.hash.startsWith('#about')){location.replace('about.html');return}
 if(location.hash.startsWith('#exam')){location.replace('exam-system.html');return}
 const [r,p]=(location.hash.slice(1)||'home').split('/');view(['home','questions'].includes(r)?r:'home',p);window.scrollTo(0,0)}
addEventListener('hashchange',route);route();
