(function(){
  var SRC=document.currentScript&&document.currentScript.src;
  var GH='https://ad5-loser.github.io/NURSING-NOTEBOOK/';
  /* Vercel main domain -> GitHub Pages (latest version). Add ?noredirect to stay. Demo domain is not affected. */
  if(location.hostname==='nursing-notebook.vercel.app'&&location.search.indexOf('noredirect')<0){
    location.replace(GH+location.pathname.replace(/^\//,'')+location.search+location.hash);return;
  }
  /* service worker */
  if('serviceWorker' in navigator&&SRC&&location.protocol==='https:'){
    window.addEventListener('load',function(){navigator.serviceWorker.register(new URL('sw.js',SRC).href).catch(function(){})});
  }
  /* install button (styles live in style.css) */
  var dp=null;
  var standalone=function(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true};
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e});
  window.addEventListener('appinstalled',function(){var b=document.getElementById('instBtn');if(b)b.remove()});
  var ICON='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19h14"/></svg>';
  document.addEventListener('DOMContentLoaded',function(){
    if(standalone())return;
    var btn=document.createElement('button');btn.id='instBtn';btn.className='inst';btn.type='button';
    btn.innerHTML=ICON+'Install';btn.setAttribute('aria-label','Install Nursing Notebook app');
    var host=document.querySelector('.top-in');
    if(host)host.appendChild(btn);else{btn.classList.add('inst-fixed');document.body.appendChild(btn)}
    btn.addEventListener('click',function(){
      if(dp){dp.prompt();dp.userChoice.finally(function(){dp=null});return}
      var ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
      var ov=document.createElement('div');ov.className='inst-ov';
      ov.innerHTML='<div class="inst-box" role="dialog" aria-modal="true"><h3>Install Nursing Notebook</h3><p>'+(ios?'Tap <b>Share</b> in Safari, then choose <b>Add to Home Screen</b>.':'Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.')+'</p><button class="b-dark inst-ok" type="button">Got it</button></div>';
      ov.addEventListener('click',function(e){if(e.target===ov||e.target.tagName==='BUTTON')ov.remove()});
      document.body.appendChild(ov);
    });
  });
})();
