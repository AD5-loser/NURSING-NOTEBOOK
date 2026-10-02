const D = window.NNB_DATA;
const LINKS = {};
const EXAM_YEARS = [2025,2024,2023,2022,2021,2020,2019,2018];
const PROGRAM = { years: D.years.map((y,i)=>({
  id:"year"+(i+1), label:y.label, available:y.subjects.length>0,
  subjects:y.subjects.map(s=>{ LINKS[s.code]=s.exams; return {id:s.code, name:s.name}; })
}))};

let route = { view:"home" };

function navigate(next){
  route = next;
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}

function getYear(id){ return PROGRAM.years.find(y=>y.id===id); }
function getSubject(year, id){ return year?.subjects.find(s=>s.id===id); }

function renderBreadcrumb(activeYear, activeSubject){
  const bc = document.getElementById('breadcrumb');
  const inner = document.getElementById('breadcrumbInner');
  if(route.view==='home'){ bc.style.display='none'; return; }
  bc.style.display='block';
  const crumbs = [{label:"B.Sc. in Nursing", onClick:()=>navigate({view:'home'})}];
  if(activeYear) crumbs.push({label:activeYear.label, onClick:()=>navigate({view:'year', yearId:activeYear.id})});
  if(activeSubject) crumbs.push({label:activeSubject.name, onClick:null});
  inner.innerHTML='';
  crumbs.forEach((c,i)=>{
    const group=document.createElement('span'); group.className='crumb-group';
    if(c.onClick){
      const b=document.createElement('button'); b.className='crumb'; b.innerText=c.label; b.onclick=c.onClick;
      group.appendChild(b);
    } else {
      const s=document.createElement('span'); s.className='crumb crumb-current'; s.innerText=c.label;
      group.appendChild(s);
    }
    if(i<crumbs.length-1){
      const sep=document.createElement('span'); sep.className='crumb-sep'; sep.innerText='›';
      group.appendChild(sep);
    }
    inner.appendChild(group);
  });
}

function render(){
  const activeYear = getYear(route.yearId);
  const activeSubject = getSubject(activeYear, route.subjectId);
  renderBreadcrumb(activeYear, activeSubject);
  const el = document.getElementById('content');

  if(route.view==='home'){ el.innerHTML = homeView(); return; }

  if(route.view==='year' && activeYear && !activeYear.available){
    el.innerHTML = comingSoon(activeYear.label, "এই বর্ষের স্টাডি মেটেরিয়াল এখনো যোগ করা হয়নি।", "B.Sc. in Nursing-এ ফিরে যান");
    return;
  }
  if(route.view==='year' && activeYear && activeYear.available){
    el.innerHTML = subjectsView(activeYear); return;
  }
  if(route.view==='subject' && activeYear && activeSubject){
    el.innerHTML = examYearsView(activeYear, activeSubject); return;
  }
}

const ICONS={B111:"💬",B112:"💻",B113:"🧠",B124:"🦴",B125:"🫀",B126:"🔬",B137:"🩺"};
function countPapers(id){return Object.values(LINKS[id]||{}).reduce((n,e)=>n+(e.written?1:0)+(e.mcq?1:0),0);}

function homeView(){
  const subs=PROGRAM.years.flatMap(y=>y.subjects);
  const papers=subs.reduce((n,s)=>n+countPapers(s.id),0);
  const cards = PROGRAM.years.map((year,i)=>`
    <button class="year-card yc${i}" onclick='navigate({view:"year",yearId:"${year.id}"})'>
      <span class="year-num">${i+1}</span>
      <div class="year-card-top">
        <span class="year-card-label">${year.label}</span>
        <span class="status-pill ${year.available?'status-live':'status-soon'}">${year.available?'Available':'Coming soon'}</span>
      </div>
      <div class="year-card-bottom">
        <span class="year-card-cta">${year.available?year.subjects.length+' subjects':'Notify me later'}</span>
        <span class="year-card-arrow">›</span>
      </div>
    </button>`).join('');
  return `
    <div class="view">
      <section class="hero">
        <div>
          <span class="hero-eyebrow-icon">🎓</span>
          <h1>B.Sc. in Nursing</h1>
          <p class="hero-sub">বিগত সালের বোর্ড পরীক্ষার প্রশ্ন, বর্ষ ও বিষয় অনুযায়ী সাজানো — সহজে রিভিশনের জন্য।</p>
          <div class="stats">
            <div class="stat"><b>${subs.length}</b><span>Subjects</span></div>
            <div class="stat"><b>${papers}</b><span>Question papers</span></div>
            <div class="stat"><b>2018–2024</b><span>Exam years</span></div>
          </div>
        </div>
        <svg class="hero-art" viewBox="0 0 240 220" aria-hidden="true">
          <circle cx="120" cy="110" r="96" fill="#E8F0EE"/>
          <circle cx="196" cy="42" r="22" fill="#FBF0E0"/>
          <rect x="62" y="34" width="116" height="152" rx="12" fill="#0F5257"/>
          <rect x="74" y="34" width="104" height="152" rx="10" fill="#FAF9F6"/>
          <rect x="88" y="60" width="64" height="8" rx="4" fill="#0F5257"/>
          <rect x="88" y="82" width="76" height="6" rx="3" fill="#DCE4E1"/>
          <rect x="88" y="98" width="70" height="6" rx="3" fill="#DCE4E1"/>
          <rect x="88" y="114" width="76" height="6" rx="3" fill="#DCE4E1"/>
          <rect x="88" y="136" width="30" height="20" rx="5" fill="#C98A3E"/>
          <rect x="124" y="136" width="30" height="20" rx="5" fill="#2F6F9F"/>
          <path d="M150 34v34l11-8 11 8V34z" fill="#C98A3E"/>
        </svg>
      </section>
      <section class="year-grid">${cards}</section>
    </div>`;
}

function subjectsView(year){
  const cards = year.subjects.map((s,i)=>`
    <button class="subject-card t${i%7}" onclick='navigate({view:"subject",yearId:"${year.id}",subjectId:"${s.id}"})'>
      <span class="s-icon">${ICONS[s.id]||"📘"}</span>
      <span class="subject-card-name">${s.name}<span class="subject-card-meta">${countPapers(s.id)} papers · ${Object.keys(LINKS[s.id]).length} years</span></span>
      <span class="subject-card-arrow">›</span>
    </button>`).join('');
  return `
    <div class="view">
      <div class="view-header"><h2>${year.label} subjects</h2><p class="view-subhead">যে বিষয়ের প্রশ্ন দেখতে চান, সেটাতে ক্লিক করুন।</p></div>
      <div class="subject-grid">${cards}</div>
    </div>`;
}

function examYearsView(year, subject){
  const rows = EXAM_YEARS.filter(ey=>LINKS[subject.id] && LINKS[subject.id][ey]).map(ey=>{
    const data = LINKS[subject.id] && LINKS[subject.id][ey];
    const available = !!data;
    let optionsHtml = '';
    if(available){
      const btns = [];
      if(data.written) btns.push(`<a class="option-btn opt-w" href="${data.written}" target="_blank" rel="noopener">রিটেন</a>`);
      if(data.mcq) btns.push(`<a class="option-btn opt-m" href="${data.mcq}" target="_blank" rel="noopener">এমসিকিউ</a>`);
      optionsHtml = `<div class="exam-year-options-inner">${btns.join('')}</div>`;
    } else {
      optionsHtml = `<div class="exam-year-options-inner"><span class="option-soon">এই সালের প্রশ্ন এখনো যোগ করা হয়নি।</span></div>`;
    }
    return `
      <div class="exam-year-block" id="block-${ey}">
        <button class="exam-year-pill" onclick="toggleBlock(${ey})">
          <span class="exam-year-number">${ey}</span>
          <span class="exam-year-right">
            <span class="status-pill ${available?'status-live':'status-soon'}">${available?'Available':'Coming soon'}</span>
            <span class="exam-year-chev">›</span>
          </span>
        </button>
        <div class="exam-year-options">${optionsHtml}</div>
      </div>`;
  }).join('');
  return `
    <div class="view">
      <div class="view-header"><h2>${subject.name}</h2><p class="view-subhead">যে সালের প্রশ্ন দেখতে চান, সেটাতে ক্লিক করুন — রিটেন বা এমসিকিউ অপশন খুলে যাবে।</p></div>
      <div class="exam-year-list">${rows}</div>
    </div>`;
}

function toggleBlock(ey){
  const block = document.getElementById('block-'+ey);
  const wasOpen = block.classList.contains('open');
  document.querySelectorAll('.exam-year-block.open').forEach(b=>b.classList.remove('open'));
  if(!wasOpen) block.classList.add('open');
}

function comingSoon(title, message, backLabel){
  return `
    <div class="empty-state">
      <span class="empty-icon">⏳</span>
      <h3>${title}</h3>
      <p>${message}</p>
      <button class="empty-back" onclick='navigate({view:"home"})'>← ${backLabel}</button>
    </div>`;
}

render();
