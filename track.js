/* Nursing Notebook: custom GA4 events. GA4 is loaded once (gtag snippet in <head>); GTM has no GA4 tag, so nothing is counted twice. */
(function(){
  function ev(n,p){try{if(typeof gtag==='function')gtag('event',n,p||{})}catch(e){}}
  window.nnbTrack=ev;
  try{
    var sa=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
    if(typeof gtag==='function')gtag('set','user_properties',{app_mode:sa?'pwa':'web'});
  }catch(e){}
  function page(){var p=location.pathname.split('/').pop().replace('.html','');return p||'index'}
  function where(a){
    if(a.closest('.donate'))return 'home_donate';
    if(a.closest('.coupon'))return 'about_card';
    if(a.closest('.links'))return 'about_links';
    return page();
  }
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a,button'):null;
    if(!a)return;
    if(a.classList.contains('pb')){
      var d=a.dataset;
      ev('paper_open',{subject_code:d.code||'',subject_name:d.subject||'',exam_year:d.year||'',paper_type:d.type||'',paper_set:d.set||'',academic_year:d.ay||'',source_page:page()});
      return;
    }
    if(a.id==='pb'){if(/View/.test(a.textContent))ev('exam_pdf_view',{mode:'inline'});return}
    if(page()==='exam-system'&&a.closest('.tabs')){ev('exam_year_tab',{year_label:a.textContent.trim()});return}
    var h=a.getAttribute?a.getAttribute('href')||'':'';
    if(!h)return;
    var plat=/t\.me\//.test(h)?'telegram':/facebook\.com/.test(h)?'facebook':/^mailto:/.test(h)?'email':'';
    if(plat){ev('social_click',{platform:plat,location:where(a)});return}
    if(/drive\.google\.com\/file/.test(h)&&a.closest('.pdfbar'))ev('exam_pdf_view',{mode:'new_tab'});
  },true);
})();
