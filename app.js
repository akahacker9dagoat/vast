/* app.js - Vast desktop core (lightweight) */
(() => {
  const state = {
    z: 10,
    windows: [],
    settings: loadSettings(),
  };

  function $(s,root=document) {return root.querySelector(s)}
  function $all(s,root=document){return Array.from(root.querySelectorAll(s))}

  // Utilities
  function loadSettings(){
    try{const v=localStorage.getItem('vast.settings');return v?JSON.parse(v):{theme:'system',wallpaper:0,search:'https://www.google.com/search?q='}}catch(e){return {theme:'system',wallpaper:0,search:'https://www.google.com/search?q='}}
  }
  function saveSettings(){localStorage.setItem('vast.settings', JSON.stringify(state.settings))}

  // Clock
  function tick(){const el=$('#clock'); if(!el) return; const d=new Date(); el.textContent = d.toLocaleString([], {hour:'2-digit',minute:'2-digit'});}
  setInterval(tick,1000); tick();

  // Start menu
  const startBtn = $('#start-button');
  const startMenu = $('#start-menu');
  startBtn.addEventListener('click', e=>{const expanded = startBtn.getAttribute('aria-expanded')==='true'; startBtn.setAttribute('aria-expanded', String(!expanded)); startMenu.classList.toggle('hidden'); $('#launcher-search').focus();})

  // Desktop icons
  const apps = [
    {id:'browser',name:'Browser',run:openBrowser},
    {id:'settings',name:'Settings',run:openSettings},
    {id:'files',name:'Files',run:openFiles}
  ];
  function populateLauncher(){const list = $('#launcher-list'); list.innerHTML=''; apps.forEach(a=>{const el=document.createElement('button');el.textContent=a.name;el.className='launcher-item'; el.addEventListener('click',()=>{a.run(); startMenu.classList.add('hidden')}); list.appendChild(el)})}
  populateLauncher();

  $all('.icon').forEach(i=>{i.addEventListener('dblclick', ()=>{const app = apps.find(a=>a.id===i.dataset.app); if(app) app.run();}); i.addEventListener('keydown', e=>{if(e.key==='Enter') {const app = apps.find(a=>a.id===i.dataset.app); if(app) app.run();}})})

  // Window manager
  const windowsRoot = $('#windows');
  const template = $('#window-template');
  function createWindow(title, options={width:720,height:480}){
    const node = template.content.firstElementChild.cloneNode(true);
    node.style.width = options.width+'px'; node.style.height = options.height+'px';
    node.style.left = (40 + (state.windows.length*24))+'px'; node.style.top = (60 + (state.windows.length*24))+'px';
    node.dataset.z = ++state.z; node.style.zIndex = node.dataset.z;
    node.querySelector('.window-title').textContent = title;
    makeDraggable(node);
    makeResizable(node);

    const id = 'w'+Date.now()+Math.floor(Math.random()*99);
    node.dataset.winId = id;
    windowsRoot.appendChild(node);
    node.querySelector('.close').addEventListener('click', ()=>{node.remove(); state.windows = state.windows.filter(w=>w!==id)});
    node.addEventListener('mousedown', ()=>{focusWindow(node)});
    state.windows.push(id);
    focusWindow(node);
    return node;
  }
  function focusWindow(node){ state.z++; node.style.zIndex = state.z; node.classList.add('focused'); $all('.window').forEach(w=>{if(w!==node) w.classList.remove('focused')}); }

  function makeDraggable(node){
    const header = node.querySelector('.window-header');
    let dragging=false, ox=0, oy=0;
    header.addEventListener('pointerdown', (e)=>{dragging=true; ox = e.clientX - node.offsetLeft; oy = e.clientY - node.offsetTop; node.setPointerCapture(e.pointerId);});
    header.addEventListener('pointermove', (e)=>{if(!dragging) return; node.style.left = (e.clientX - ox)+'px'; node.style.top = (e.clientY - oy)+'px';});
    header.addEventListener('pointerup', (e)=>{dragging=false;try{node.releasePointerCapture(e.pointerId)}catch{}});
  }
  function makeResizable(node){
    const res = node.querySelector('.window-resize');
    let resizing=false, ow=0, oh=0, ox=0, oy=0;
    res.addEventListener('pointerdown', e=>{resizing=true; ow=node.offsetWidth; oh=node.offsetHeight; ox=e.clientX; oy=e.clientY; res.setPointerCapture(e.pointerId);});
    res.addEventListener('pointermove', e=>{if(!resizing) return; node.style.width = Math.max(300, ow + (e.clientX-ox))+'px'; node.style.height = Math.max(160, oh + (e.clientY-oy))+'px';});
    res.addEventListener('pointerup', e=>{resizing=false; try{res.releasePointerCapture(e.pointerId)}catch{}});
  }

  // Basic apps
  function openBrowser(){
    const win = createWindow('Browser',{width:900,height:600});
    const body = win.querySelector('.window-body');
    body.innerHTML = browserUI();
    initBrowser(body);
  }

  function openSettings(){
    const win = createWindow('Settings',{width:520,height:420});
    const body = win.querySelector('.window-body');
    body.innerHTML = settingsUI();
    initSettings(body);
  }
  function openFiles(){
    const win = createWindow('Files',{width:520,height:420});
    const body = win.querySelector('.window-body');
    body.innerHTML = '<p>Files app placeholder — Vast does not include a real filesystem.</p>';
  }

  // Browser implementation (lightweight)
  function browserUI(){
    return `
      <div class="tabbar" role="tablist"></div>
      <div class="browser-toolbar">
        <div class="nav">
          <button data-act="back">◀</button>
          <button data-act="forward">▶</button>
          <button data-act="reload">⟳</button>
          <button data-act="home">🏠</button>
        </div>
        <div class="addr">
          <input class="address" placeholder="Search or enter address" aria-label="Address bar">
          <button data-act="go">Go</button>
        </div>
        <div style="margin-left:8px;display:flex;gap:6px;align-items:center">
          <button data-act="newtab">＋</button>
          <button data-act="bookmark">★</button>
        </div>
      </div>
      <div class="bookmarks" aria-label="Bookmarks bar"></div>
      <div class="content" style="height:calc(100% - 132px);border:1px solid rgba(0,0,0,0.06);border-radius:8px;overflow:hidden;display:flex;flex-direction:column">
        <div class="webview-holder" style="flex:1;position:relative">
        </div>
      </div>
    `;
  }

  function initBrowser(root){
    const tabbar = root.querySelector('.tabbar');
    const bookmarksBar = root.querySelector('.bookmarks');
    const address = root.querySelector('.address');
    const holder = root.querySelector('.webview-holder');

    // state per browser window
    const bstate = {tabs:[], active:0, history:[], bookmarks: loadBookmarks()};

    function saveBookmarks(){localStorage.setItem('vast.bookmarks', JSON.stringify(bstate.bookmarks))}
    function loadBookmarks(){try{return JSON.parse(localStorage.getItem('vast.bookmarks')||'[]')}catch(e){return []}}

    function renderBookmarks(){bookmarksBar.innerHTML=''; bstate.bookmarks.forEach(b=>{const el=document.createElement('button');el.className='bookmark';el.textContent=b.title||b.url; el.title=b.url; el.addEventListener('click',()=>{openInTab(b.url)}); bookmarksBar.appendChild(el)})}
    renderBookmarks();

    function addTab(url){const tab = {id:'t'+Date.now(),url:normalizeUrl(url),title:url,history:[],index:-1}; bstate.tabs.push(tab); bstate.active = bstate.tabs.length-1; renderTabs(); loadTab(bstate.active);}
    function renderTabs(){tabbar.innerHTML=''; bstate.tabs.forEach((t,i)=>{const el=document.createElement('button'); el.className='tab'+(i===bstate.active?' active':''); el.textContent = t.title||t.url; el.addEventListener('click', ()=>{bstate.active=i; renderTabs(); loadTab(i)}); tabbar.appendChild(el)});}

    function normalizeUrl(input){if(!input) return 'about:blank'; input = input.trim(); if(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input)) return input; // has scheme
      if(input.includes(' ') || !input.includes('.')){ return state.settings.search + encodeURIComponent(input); }
      // looks like host/path
      return (input.startsWith('http')?input:'https://'+input);
    }

    function openInTab(url){addTab(url)}

    function loadTab(i){holder.innerHTML=''; const tab = bstate.tabs[i]; if(!tab) return; address.value = tab.url; const iframe = document.createElement('iframe'); iframe.style.width='100%'; iframe.style.height='100%'; iframe.style.border=0; iframe.setAttribute('sandbox','allow-forms allow-scripts allow-same-origin allow-popups'); holder.appendChild(iframe);
      // loading UI
      const loader = document.createElement('div'); loader.className='load-overlay'; loader.textContent = 'Loading...'; loader.style.position='absolute'; loader.style.inset='0'; loader.style.display='flex'; loader.style.alignItems='center'; loader.style.justifyContent='center'; loader.style.background='rgba(0,0,0,0.04)'; holder.appendChild(loader);

      let loaded=false; const to = setTimeout(()=>{ if(!loaded){ loader.textContent = 'This site may refuse to be embedded. Open externally?'; const b = document.createElement('button'); b.textContent='Open in new tab'; b.addEventListener('click', ()=>{window.open(tab.url,'_blank')}); loader.appendChild(b); } }, 9000);

      iframe.onload = function(){ loaded=true; clearTimeout(to); loader.remove(); try{ tab.title = iframe.contentDocument.title || tab.url }catch(e){ tab.title = tab.url } renderTabs(); };
      iframe.onerror = function(){loaded=true; clearTimeout(to); loader.textContent = 'Failed to load. Open externally?';}
      iframe.src = tab.url;
    }

    // toolbar actions
    root.addEventListener('click', e=>{
      const act = e.target.getAttribute('data-act'); if(!act) return;
      if(act==='go'){const v=address.value; openInTab(v)}
      if(act==='newtab'){addTab('about:blank')}
      if(act==='bookmark'){ const url = address.value; bstate.bookmarks.push({url, title:url}); saveBookmarks(); renderBookmarks(); }
      if(act==='reload'){ const activeTab = bstate.tabs[bstate.active]; if(activeTab) { loadTab(bstate.active)} }
      if(act==='home'){ openInTab('https://www.example.com') }
    });

    // address enter
    address.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const v=address.value; openInTab(v); } })

    // keyboard shortcuts
    root.addEventListener('keydown', e=>{
      if(e.ctrlKey && e.key.toLowerCase()==='t'){ e.preventDefault(); addTab('about:blank'); }
      if(e.ctrlKey && e.key.toLowerCase()==='w'){ e.preventDefault(); const i=bstate.active; if(i>=0){ bstate.tabs.splice(i,1); bstate.active = Math.max(0, i-1); renderTabs(); loadTab(bstate.active);} }
      if(e.ctrlKey && e.key.toLowerCase()==='l'){ e.preventDefault(); address.select(); address.focus(); }
      if(e.ctrlKey && e.key.toLowerCase()==='d'){ e.preventDefault(); bstate.bookmarks.push({url:address.value,title:address.value}); saveBookmarks(); renderBookmarks(); }
    }, true);

    // initial tab
    addTab('https://example.com');
  }

  // Settings UI
  function settingsUI(){
    return `
      <h3>Appearance</h3>
      <label>Theme: <select id="theme-select"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
      <h3>Wallpaper</h3>
      <div id="wallpaper-choices" style="display:flex;gap:8px;margin-top:8px"></div>
      <h3>Browser</h3>
      <label>Search engine URL: <input id="search-url" style="width:100%"></label>
      <div style="margin-top:12px"><button id="reset-settings">Reset to defaults</button></div>
    `;
  }

  function initSettings(root){
    const theme = root.querySelector('#theme-select'); theme.value = state.settings.theme || 'system'; theme.addEventListener('change', ()=>{ state.settings.theme = theme.value; applyTheme(); saveSettings(); });
    const search = root.querySelector('#search-url'); search.value = state.settings.search || 'https://www.google.com/search?q='; search.addEventListener('change', ()=>{state.settings.search=search.value; saveSettings();});
    const choices = root.querySelector('#wallpaper-choices'); ['gradient-1','gradient-2','gradient-3'].forEach((c,i)=>{const b=document.createElement('button');b.style.width='64px';b.style.height='40px';b.style.borderRadius='8px';b.dataset.idx=i; if(i===0) b.style.background='linear-gradient(135deg,#0ea5b3,#7c3aed)'; if(i===1) b.style.background='linear-gradient(135deg,#34a853,#4285f4)'; if(i===2) b.style.background='linear-gradient(135deg,#ff6d01,#a142f4)'; b.addEventListener('click', ()=>{state.settings.wallpaper=i; applyWallpaper(); saveSettings();}); choices.appendChild(b)})
    root.querySelector('#reset-settings').addEventListener('click', ()=>{ localStorage.removeItem('vast.settings'); Object.assign(state, {settings:loadSettings()}); applyTheme(); applyWallpaper(); alert('Settings reset') })
  }

  function applyTheme(){ const t = state.settings.theme||'system'; document.body.classList.remove('theme-dark','theme-light','theme-system'); if(t==='dark') document.body.classList.add('theme-dark'); else if(t==='light') document.body.classList.add('theme-light'); else document.body.classList.add('theme-system'); }
  function applyWallpaper(){ const w = $('#wallpaper'); const idx = state.settings.wallpaper||0; if(idx===0) w.style.background = 'linear-gradient(135deg,#0ea5b3,#7c3aed)'; if(idx===1) w.style.background='linear-gradient(135deg,#34a853,#4285f4)'; if(idx===2) w.style.background='linear-gradient(135deg,#ff6d01,#a142f4)'; }

  // Bookmarks
  function loadBookmarks(){try{return JSON.parse(localStorage.getItem('vast.bookmarks')||'[]')}catch(e){return []}}

  // init
  applyTheme(); applyWallpaper();

  // Expose some globals for debugging
  window.vast = {openBrowser, openSettings, state};

})();
