/* BUKU TULIS DIGITAL PRO - app.js */

// ── State ──
var state = { tool:'text', penColor:'#1a1a2e', penSize:3 };
var pages = [];
var currentPage = 0;
var currentFont = "'Caveat',cursive";
var isDrawing = false, lastX = 0, lastY = 0;
var signDrawing = false, signLastX = 0, signLastY = 0;
var autoTimer = null;

// ── DOM ──
var sidebar         = document.getElementById('sidebar');
var sidebarOverlay  = document.getElementById('sidebarOverlay');
var hamburger       = document.getElementById('hamburger');
var pageList        = document.getElementById('pageList');
var btnAddPage      = document.getElementById('btnAddPage');
var btnPrevPage     = document.getElementById('btnPrevPage');
var btnNextPage     = document.getElementById('btnNextPage');
var btnDeletePage   = document.getElementById('btnDeletePage');
var pageTitleInput  = document.getElementById('pageTitleInput');
var currentPageLbl  = document.getElementById('currentPageLabel');
var notebookPage    = document.getElementById('notebookPage');
var drawCanvas      = document.getElementById('drawCanvas');
var ctx             = drawCanvas.getContext('2d');
var textLayer       = document.getElementById('textLayer');
var mainTextBlock   = document.getElementById('mainTextBlock');
var imageLayer      = document.getElementById('imageLayer');
var imageInput      = document.getElementById('imageInput');
var txtInput        = document.getElementById('txtInput');
var signOverlay     = document.getElementById('signOverlay');
var signCanvas      = document.getElementById('signCanvas');
var sctx            = signCanvas.getContext('2d');
var toolText        = document.getElementById('toolText');
var toolDraw        = document.getElementById('toolDraw');
var toolErase       = document.getElementById('toolErase');
var toolImage       = document.getElementById('toolImage');
var toolSign        = document.getElementById('toolSign');
var fontStyleSelect = document.getElementById('fontStyleSelect');
var penColorInput   = document.getElementById('penColor');
var penSizeInput    = document.getElementById('penSize');
var penSizeLabel    = document.getElementById('penSizeLabel');
var btnSaveTxt      = document.getElementById('btnSaveTxt');
var btnLoadTxt      = document.getElementById('btnLoadTxt');
var btnExportPNG    = document.getElementById('btnExportPNG');
var btnExportPDF    = document.getElementById('btnExportPDF');
var btnHistory      = document.getElementById('btnHistory');
var btnInfo         = document.getElementById('btnInfo');
var btnClearSign    = document.getElementById('btnClearSign');
var btnSaveSign     = document.getElementById('btnSaveSign');
var btnCancelSign   = document.getElementById('btnCancelSign');
var toast           = document.getElementById('toast');

// ════════════════════════════
// FIX 1: SIDEBAR BUKA/TUTUP
// ════════════════════════════
function openSidebar(){
  sidebar.classList.add('show');
  sidebarOverlay.classList.add('show');
}
function closeSidebar(){
  sidebar.classList.remove('show');
  sidebarOverlay.classList.remove('show');
}
hamburger.addEventListener('click', function(e){
  e.stopPropagation();
  sidebar.classList.contains('show') ? closeSidebar() : openSidebar();
});
sidebarOverlay.addEventListener('click', closeSidebar);

function closeIfMobile(){
  if(window.innerWidth <= 700) setTimeout(closeSidebar, 120);
}

// ── Page Data ──
function createPage(){
  return { title:'', canvasData:null, textContent:'', font:currentFont, images:[], created: new Date().toLocaleString('id-ID') };
}

function savePage(){
  var p = pages[currentPage];
  if(!p) return;
  p.title       = pageTitleInput.value;
  p.canvasData  = drawCanvas.toDataURL();
  p.textContent = mainTextBlock.innerHTML;
  p.font        = currentFont;
  p.images      = [];
  var imgs = imageLayer.querySelectorAll('.pasted-image');
  for(var i=0;i<imgs.length;i++){
    p.images.push({ src:imgs[i].querySelector('img').src, x:parseInt(imgs[i].style.left)||50, y:parseInt(imgs[i].style.top)||50 });
  }
}

function loadPage(idx){
  var p = pages[idx];
  if(!p) return;
  resizeCanvas();
  ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);
  if(p.canvasData && p.canvasData!=='data:,'){
    var img = new Image();
    img.onload = function(){ ctx.drawImage(img,0,0); };
    img.src = p.canvasData;
  }
  mainTextBlock.innerHTML = p.textContent || '';
  pageTitleInput.value    = p.title || '';
  currentFont = p.font || "'Caveat',cursive";
  mainTextBlock.style.fontFamily = currentFont;
  for(var i=0;i<fontStyleSelect.options.length;i++){
    if(fontStyleSelect.options[i].value === currentFont){ fontStyleSelect.selectedIndex=i; break; }
  }
  imageLayer.innerHTML='';
  for(var j=0;j<p.images.length;j++) placeImage(p.images[j].src, p.images[j].x, p.images[j].y);
  currentPageLbl.textContent = 'Halaman '+(idx+1)+' / '+pages.length+(p.title?' — '+p.title:'');
}

function renderPageList(){
  pageList.innerHTML='';
  for(var i=0;i<pages.length;i++){
    (function(idx){
      var d=document.createElement('div');
      d.className='page-item'+(idx===currentPage?' active':'');
      d.textContent='📄 '+(pages[idx].title||'Halaman '+(idx+1));
      d.addEventListener('click',function(){ switchPage(idx); closeIfMobile(); });
      pageList.appendChild(d);
    })(i);
  }
}

function switchPage(idx){
  savePage(); currentPage=idx; loadPage(idx); renderPageList();
}

// ── Canvas Resize ──
function resizeCanvas(){
  var w = notebookPage.offsetWidth;
  var h = Math.max(notebookPage.offsetHeight, 1000);
  if(drawCanvas.width===w && drawCanvas.height===h) return;
  var tmp = drawCanvas.toDataURL();
  drawCanvas.width=w; drawCanvas.height=h;
  if(tmp && tmp!=='data:,'){
    var img=new Image();
    img.onload=function(){ ctx.drawImage(img,0,0); };
    img.src=tmp;
  }
}

// ════════════════════════════
// FIX 2: TOOL — MENULIS & GAMBAR
// Kunci: atur pointer-events tiap layer
// ════════════════════════════
function setTool(name){
  state.tool = name;

  // Reset semua tool button
  var btns = document.querySelectorAll('.tool-btn');
  for(var i=0;i<btns.length;i++) btns[i].classList.remove('active');

  // Reset pointer-events semua layer
  drawCanvas.style.pointerEvents  = 'none';
  drawCanvas.style.cursor         = 'default';
  textLayer.style.pointerEvents   = 'none';
  mainTextBlock.style.pointerEvents = 'none';
  imageLayer.style.pointerEvents  = 'none';

  if(name==='text'){
    toolText.classList.add('active');
    // TEXT LAYER aktif, canvas tidak aktif
    textLayer.style.pointerEvents   = 'auto';
    mainTextBlock.style.pointerEvents = 'auto';
    mainTextBlock.focus();

  } else if(name==='draw'){
    toolDraw.classList.add('active');
    // CANVAS aktif
    drawCanvas.style.pointerEvents = 'auto';
    drawCanvas.style.cursor        = 'crosshair';

  } else if(name==='erase'){
    toolErase.classList.add('active');
    drawCanvas.style.pointerEvents = 'auto';
    drawCanvas.style.cursor        = 'cell';

  } else if(name==='image'){
    toolImage.classList.add('active');
    imageLayer.style.pointerEvents = 'auto';
    imageInput.click();

  } else if(name==='sign'){
    toolSign.classList.add('active');
    openSignPad();
  }
}

toolText.addEventListener('click',  function(){ setTool('text');  closeIfMobile(); });
toolDraw.addEventListener('click',  function(){ setTool('draw');  closeIfMobile(); });
toolErase.addEventListener('click', function(){ setTool('erase'); closeIfMobile(); });
toolImage.addEventListener('click', function(){ setTool('image'); closeIfMobile(); });
toolSign.addEventListener('click',  function(){ setTool('sign');  closeIfMobile(); });

// ════════════════════════════
// FIX 3: DRAWING (mouse + touch)
// ════════════════════════════
function getXY(e, el){
  var rect = el.getBoundingClientRect();
  var sx = el.width / rect.width;
  var sy = el.height / rect.height;
  var cx = e.touches ? e.touches[0].clientX : e.clientX;
  var cy = e.touches ? e.touches[0].clientY : e.clientY;
  return { x:(cx-rect.left)*sx, y:(cy-rect.top)*sy };
}

drawCanvas.addEventListener('mousedown', function(e){
  if(state.tool!=='draw' && state.tool!=='erase') return;
  isDrawing=true;
  var p=getXY(e,drawCanvas); lastX=p.x; lastY=p.y;
  // titik awal
  ctx.beginPath(); ctx.arc(lastX,lastY,state.penSize/2,0,Math.PI*2);
  ctx.globalCompositeOperation = state.tool==='erase'?'destination-out':'source-over';
  ctx.fillStyle = state.tool==='erase'?'rgba(0,0,0,1)':state.penColor;
  ctx.fill(); ctx.globalCompositeOperation='source-over';
});
drawCanvas.addEventListener('touchstart', function(e){
  if(state.tool!=='draw' && state.tool!=='erase') return;
  e.preventDefault(); isDrawing=true;
  var p=getXY(e,drawCanvas); lastX=p.x; lastY=p.y;
}, {passive:false});

function doDraw(e){
  if(!isDrawing) return;
  if(e.touches) e.preventDefault();
  var p=getXY(e,drawCanvas);
  ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y);
  ctx.lineCap=ctx.lineJoin='round';
  ctx.lineWidth=state.penSize;
  if(state.tool==='erase'){
    ctx.globalCompositeOperation='destination-out';
    ctx.strokeStyle='rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle=state.penColor;
  }
  ctx.stroke(); lastX=p.x; lastY=p.y;
}
function stopDraw(){ isDrawing=false; ctx.globalCompositeOperation='source-over'; }

drawCanvas.addEventListener('mousemove',  doDraw);
drawCanvas.addEventListener('touchmove',  doDraw, {passive:false});
drawCanvas.addEventListener('mouseup',    stopDraw);
drawCanvas.addEventListener('mouseleave', stopDraw);
drawCanvas.addEventListener('touchend',   stopDraw);

// ── Font & Pen ──
fontStyleSelect.addEventListener('change', function(){
  currentFont = this.value;
  mainTextBlock.style.fontFamily = currentFont;
  showToast('Gaya tulisan diubah ✓');
});
penColorInput.addEventListener('input', function(){ state.penColor=this.value; });
penSizeInput.addEventListener('input',  function(){
  state.penSize=parseInt(this.value);
  penSizeLabel.textContent=state.penSize+'px';
});

// ── Page title ──
pageTitleInput.addEventListener('input', function(){
  var p=pages[currentPage]; if(p) p.title=this.value;
  currentPageLbl.textContent='Halaman '+(currentPage+1)+' / '+pages.length+(this.value?' — '+this.value:'');
  renderPageList();
});

// ── Signature ──
function openSignPad(){
  sctx.clearRect(0,0,signCanvas.width,signCanvas.height);
  signOverlay.style.display='flex';
}

signCanvas.addEventListener('mousedown',  function(e){ signDrawing=true; var p=getXY(e,signCanvas); signLastX=p.x; signLastY=p.y; });
signCanvas.addEventListener('touchstart', function(e){ e.preventDefault(); signDrawing=true; var p=getXY(e,signCanvas); signLastX=p.x; signLastY=p.y; }, {passive:false});
function doSign(e){
  if(!signDrawing) return;
  if(e.touches) e.preventDefault();
  var p=getXY(e,signCanvas);
  sctx.beginPath(); sctx.moveTo(signLastX,signLastY); sctx.lineTo(p.x,p.y);
  sctx.strokeStyle='#1a1a2e'; sctx.lineWidth=2.5; sctx.lineCap='round'; sctx.stroke();
  signLastX=p.x; signLastY=p.y;
}
signCanvas.addEventListener('mousemove',  doSign);
signCanvas.addEventListener('touchmove',  doSign, {passive:false});
signCanvas.addEventListener('mouseup',    function(){ signDrawing=false; });
signCanvas.addEventListener('touchend',   function(){ signDrawing=false; });
btnClearSign.addEventListener('click', function(){ sctx.clearRect(0,0,signCanvas.width,signCanvas.height); });
btnSaveSign.addEventListener('click',  function(){
  placeImage(signCanvas.toDataURL(), 80, 600);
  signOverlay.style.display='none'; setTool('text');
  showToast('Tanda tangan disimpan ✓');
});
btnCancelSign.addEventListener('click', function(){ signOverlay.style.display='none'; setTool('text'); });

// ── Image upload ──
imageInput.addEventListener('change', function(e){
  var file=e.target.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(ev){ placeImage(ev.target.result,80,80); showToast('Gambar ditambahkan ✓'); };
  reader.readAsDataURL(file); e.target.value='';
});

document.addEventListener('paste', function(e){
  for(var i=0;i<e.clipboardData.items.length;i++){
    if(e.clipboardData.items[i].type.startsWith('image/')){
      (function(blob){
        var r=new FileReader();
        r.onload=function(ev){ placeImage(ev.target.result,80,80); showToast('Gambar dari clipboard ✓'); };
        r.readAsDataURL(blob);
      })(e.clipboardData.items[i].getAsFile());
    }
  }
});

function placeImage(src,x,y){
  var wrap=document.createElement('div');
  wrap.className='pasted-image';
  wrap.style.left=x+'px'; wrap.style.top=y+'px';
  var img=document.createElement('img'); img.src=src; img.draggable=false;
  wrap.appendChild(img);
  imageLayer.appendChild(wrap);
  makeDraggable(wrap);
}

function makeDraggable(el){
  var mx,my;
  function start(e){
    e.preventDefault();
    mx=e.clientX||(e.touches&&e.touches[0].clientX)||0;
    my=e.clientY||(e.touches&&e.touches[0].clientY)||0;
    document.addEventListener('mousemove',move);
    document.addEventListener('mouseup',  stop);
    document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('touchend', stop);
  }
  function move(e){
    e.preventDefault();
    var cx=e.clientX||(e.touches&&e.touches[0].clientX)||mx;
    var cy=e.clientY||(e.touches&&e.touches[0].clientY)||my;
    el.style.left=(el.offsetLeft+cx-mx)+'px';
    el.style.top =(el.offsetTop +cy-my)+'px';
    mx=cx; my=cy;
  }
  function stop(){ document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',stop); document.removeEventListener('touchmove',move); document.removeEventListener('touchend',stop); }
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart',start,{passive:false});
}

// ── Page buttons ──
btnAddPage.addEventListener('click', function(){
  savePage(); pages.push(createPage()); currentPage=pages.length-1;
  loadPage(currentPage); renderPageList();
  showToast('Halaman '+pages.length+' ditambahkan ✓'); closeIfMobile();
});
btnPrevPage.addEventListener('click',   function(){ if(currentPage>0) switchPage(currentPage-1); });
btnNextPage.addEventListener('click',   function(){ if(currentPage<pages.length-1) switchPage(currentPage+1); });
btnDeletePage.addEventListener('click', function(){
  if(pages.length<=1){ showToast('Tidak bisa menghapus halaman terakhir!'); return; }
  if(!confirm('Hapus halaman ini?')) return;
  pages.splice(currentPage,1); currentPage=Math.min(currentPage,pages.length-1);
  loadPage(currentPage); renderPageList(); showToast('Halaman dihapus');
});

// ── Auto expand text ──
mainTextBlock.addEventListener('input', function(){
  var h=mainTextBlock.scrollHeight+80;
  if(h>1000) notebookPage.style.minHeight=h+'px';
  scheduleAutoSave();
});

// ── Auto Save localStorage ──
function scheduleAutoSave(){ clearTimeout(autoTimer); autoTimer=setTimeout(doAutoSave,1500); }
function doAutoSave(){
  savePage();
  try{ localStorage.setItem('btp_data', JSON.stringify({pages:pages,currentPage:currentPage})); showToast('Tersimpan otomatis ✓'); }catch(e){}
}
function loadStorage(){
  try{
    var d=JSON.parse(localStorage.getItem('btp_data'));
    if(d&&d.pages&&d.pages.length){ pages=d.pages; currentPage=d.currentPage||0; return true; }
  }catch(e){}
  return false;
}

// ── Save TXT ──
btnSaveTxt.addEventListener('click', function(){
  savePage();
  var nama=prompt('Nama file:','catatan')||'catatan';
  var isi='';
  for(var i=0;i<pages.length;i++){
    isi+='=== Halaman '+(i+1)+(pages[i].title?' : '+pages[i].title:'')+' ===\n';
    isi+=(pages[i].textContent||'').replace(/<[^>]+>/g,'')+'\n\n';
  }
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([isi],{type:'text/plain'}));
  a.download=nama+'.txt'; a.click();
  showToast('TXT tersimpan ✓');
});

// ── Load TXT ──
btnLoadTxt.addEventListener('click', function(){ txtInput.click(); });
txtInput.addEventListener('change', function(e){
  var file=e.target.files[0]; if(!file) return;
  var r=new FileReader();
  r.onload=function(ev){
    pages=[]; var blocks=ev.target.result.split(/===.+===/);
    for(var i=0;i<blocks.length;i++){
      if(blocks[i].trim()){ var pg=createPage(); pg.textContent=blocks[i].trim().replace(/\n/g,'<br>'); pages.push(pg); }
    }
    if(!pages.length){ var pg=createPage(); pg.textContent=ev.target.result.replace(/\n/g,'<br>'); pages.push(pg); }
    currentPage=0; loadPage(0); renderPageList(); showToast('TXT dimuat ✓');
  };
  r.readAsText(file); e.target.value='';
});

// ── Export PNG ──
btnExportPNG.addEventListener('click', function(){
  savePage();
  var a=document.createElement('a');
  a.download=(pages[currentPage].title||'halaman-'+(currentPage+1))+'.png';
  a.href=drawCanvas.toDataURL('image/png'); a.click();
  showToast('PNG tersimpan ✓');
});

// ── Export PDF ──
btnExportPDF.addEventListener('click', function(){
  savePage(); closeIfMobile(); showToast('Membuat PDF...');
  setTimeout(function(){
    try{
      var J=window.jspdf&&window.jspdf.jsPDF;
      if(!J){ showToast('Library PDF belum siap'); return; }
      var pdf=new J({orientation:'portrait',unit:'mm',format:'a4'});
      var W=210, H=297, M=15;
      for(var i=0;i<pages.length;i++){
        if(i>0) pdf.addPage();
        var p=pages[i];
        // Background
        pdf.setFillColor(255,253,246); pdf.rect(0,0,W,H,'F');
        // Garis
        pdf.setDrawColor(210,200,185); pdf.setLineWidth(0.2);
        for(var y=25;y<H;y+=8) pdf.line(0,y,W,y);
        // Margin merah
        pdf.setDrawColor(255,160,160); pdf.setLineWidth(0.4); pdf.line(20,0,20,H);
        // Judul
        if(p.title){ pdf.setFont('helvetica','bold'); pdf.setFontSize(14); pdf.setTextColor(20,20,50); pdf.text(p.title,M+8,12); }
        // Nomor halaman
        pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(160,160,160);
        pdf.text('Halaman '+(i+1)+' / '+pages.length, W-M-22, H-6);
        // Teks
        var teks=(p.textContent||'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').trim();
        if(teks){ pdf.setFont('helvetica','normal'); pdf.setFontSize(11); pdf.setTextColor(20,20,40); pdf.text(pdf.splitTextToSize(teks,W-M*2-8),M+8,p.title?22:18); }
        // Canvas drawing layer
        if(p.canvasData&&p.canvasData!=='data:,'){
          try{ pdf.addImage(p.canvasData,'PNG',0,0,W,H,'','NONE'); }catch(e2){}
        }
      }
      var nama=prompt('Nama file PDF:','buku-tulis')||'buku-tulis';
      pdf.save(nama+'.pdf');
      showToast('PDF berhasil disimpan ✓');
    }catch(err){ showToast('Error PDF: '+err.message); }
  }, 400);
});

// ── History ──
btnHistory.addEventListener('click', function(){
  closeIfMobile();
  var msg='RIWAYAT HALAMAN\n\n';
  for(var i=0;i<pages.length;i++){
    msg+='• Halaman '+(i+1)+(pages[i].title?' : '+pages[i].title:'')+'\n';
    msg+='  Dibuat: '+(pages[i].created||'-')+'\n\n';
  }
  alert(msg);
});

// ── Info ──
btnInfo.addEventListener('click', function(){
  closeIfMobile(); savePage();
  var total=0;
  for(var i=0;i<pages.length;i++) total+=(pages[i].textContent||'').replace(/<[^>]+>/g,'').length;
  alert('INFO FILE\n\nJumlah Halaman : '+pages.length+'\nTotal Karakter : '+total+'\nFont Aktif     : '+currentFont.split(',')[0].replace(/'/g,'')+'\nHalaman Aktif  : '+(currentPage+1)+'\nDibuat         : '+(pages[0]&&pages[0].created||'-'));
});

// ── Toast ──
var toastTimer;
function showToast(msg){
  toast.textContent=msg; toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){ toast.classList.remove('show'); },2200);
}

// ── Resize ──
window.addEventListener('resize', resizeCanvas);

// ── INIT ──
function init(){
  if(!loadStorage()) pages.push(createPage());
  resizeCanvas(); loadPage(currentPage); renderPageList(); setTool('text');
}
init();
