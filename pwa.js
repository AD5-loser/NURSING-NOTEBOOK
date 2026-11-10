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
  /* install button */
  var dp=null;
  var standalone=function(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true};
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e});
  window.addEventListener('appinstalled',function(){var b=document.getElementById('instBtn');if(b)b.remove()});
  document.addEventListener('DOMContentLoaded',function(){
    if(standalone())return;
    var st=document.createElement('style');
    st.textContent='.inst{background:#1f1b18;color:#fff;border-radius:8px;padding:8px 14px;font-size:.82rem;font-weight:700;min-height:40px;cursor:pointer;border:0;font-family:inherit;white-space:nowrap}.inst-fixed{position:fixed;top:10px;right:10px;z-index:50}.inst-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px}.inst-box{background:#fffdf9;border:1.5px solid #1f1b18;border-radius:10px;max-width:360px;width:100%;padding:18px;font-size:.92rem;line-height:1.55;color:#1f1a17}.inst-box b{display:block;font-size:1rem;margin-bottom:8px}.inst-box button{margin-top:12px;width:100%}';
    document.head.appendChild(st);
    var btn=document.createElement('button');btn.id='instBtn';btn.className='inst';btn.type='button';btn.textContent='\u{1F4F2} Install App';
    var host=document.querySelector('.top-in');
    if(host)host.appendChild(btn);else{btn.classList.add('inst-fixed');document.body.appendChild(btn)}
    btn.addEventListener('click',function(){
      if(dp){dp.prompt();dp.userChoice.finally(function(){dp=null});return}
      var ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
      var ov=document.createElement('div');ov.className='inst-ov';
      ov.innerHTML='<div class="inst-box"><b>Install Nursing Notebook</b>'+(ios?'Tap the <b style="display:inline">Share</b> button in Safari, then choose <b style="display:inline">Add to Home Screen</b>.':'Open your browser menu and choose <b style="display:inline">Install app</b> or <b style="display:inline">Add to Home screen</b>.')+'<button class="inst" type="button">OK</button></div>';
      ov.addEventListener('click',function(e){if(e.target===ov||e.target.tagName==='BUTTON')ov.remove()});
      document.body.appendChild(ov);
    });
  });
})();
