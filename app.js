/* ===========================
   BUKU TULIS DIGITAL - JS
   =========================== */

// ─── State ───────────────────────────────────────────────
var pages = [];
var currentPage = 0;
var currentTool = 'text';
var penColor = '#1a1a2e';
var penSize = 3;
var isDrawing = false;
var lastX = 0;
var lastY = 0;

// ─── DOM ─────────────────────────────────────────────────
var pageList       = document.getElementById('pageList');
var btnAddPage     = document.getElementById('btnAddPage');
var btnPrevPage    = document.getElementById('btnPrevPage');
var btnNextPage    = document.getElementById('btnNextPage');
var btnDeletePage  = document.getElementById('btnDeletePage');
var currentPageLbl = document.getElementById('currentPageLabel');
var notebookPage   = document.getElementById('notebookPage');
var drawCanvas     = document.getElementById('drawCanvas');
var textLayer      = document.getElementById('textLayer');
var mainTextBlock  = document.getElementById('mainTextBlock');
var imageLayer     = document.getElementById('imageLayer');
var imageInput     = document.getElementById('imageInput');
var signOverlay    = document.getElementById('signOverlay');
var signCanvas     = document.getElementById('signCanvas');
var toolText       = document.getElementById('toolText');
var toolDraw       = document.getElementById('toolDraw');
var toolSign       = document.getElementById('toolSign');
var toolImage      = document.getElementById('toolImage');
var toolErase      = document.getElementById('toolErase');
var drawOptions    = document.getElementById('drawOptions');
var penColorInput  = document.getElementById('penColor');
var penSizeInput   = document.getElementById('penSize');
var penSizeLabel   = document.getElementById('penSizeLabel');
var btnExportPNG   = document.getElementById('btnExportPNG');
var btnClearSign   = document.getElementById('btnClearSign');
var btnSaveSign    = document.getElementById('btnSaveSign');
var btnCancelSign  = document.getElementById('btnCancelSign');
var toast          = document.getElementById('toast');
var hamburger      = document.getElementById('hamburger');
var sidebar        = document.getElementById('sidebar');

var ctx  = drawCanvas.getContext('2d');
var sctx = signCanvas.getContext('2d');

// ─── Hamburger ───────────────────────────────────────────
hamburger.addEventListener('click', function() {
  var isOpen = sidebar.classList.toggle('visible');
  var overlay = document.getElementById('sidebarOverlay');
  if (isOpen) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebarOverlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(0,0,0,0.45)';
      overlay.style.zIndex = '99';
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('visible');
        overlay.remove();
      });
      document.body.appendChild(overlay);
    }
  } else {
    if (overlay) overlay.remove();
  }
});

function closeSidebar() {
  sidebar.classList.remove('visible');
  var overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.remove();
}

// ─── Page Data ───────────────────────────────────────────
function createPage() {
  return { canvasData: null, textContent: '', images: [] };
}

function savePage() {
  var p = pages[currentPage];
  if (!p) return;
  p.canvasData  = drawCanvas.toDataURL();
  p.textContent = mainTextBlock.innerHTML;
  p.images = [];
  var imgs = imageLayer.querySelectorAll('.pasted-image');
  for (var i = 0; i < imgs.length; i++) {
    var el = imgs[i];
    p.images.push({
      src: el.querySelector('img').src,
      x: parseInt(el.style.left) || 50,
      y: parseInt(el.style.top)  || 50
    });
  }
}

function loadPage(index) {
  var p = pages[index];
  if (!p) return;
  resizeCanvas();
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  if (p.canvasData) {
    var img = new Image();
    img.onload = function() { ctx.drawImage(img, 0, 0); };
    img.src = p.canvasData;
  }
  mainTextBlock.innerHTML = p.textContent || '';
  imageLayer.innerHTML = '';
  for (var i = 0; i < p.images.length; i++) {
    placeImage(p.images[i].src, p.images[i].x, p.images[i].y);
  }
  currentPageLbl.textContent = 'Halaman ' + (index + 1);
}

function renderPageList() {
  pageList.innerHTML = '';
  for (var i = 0; i < pages.length; i++) {
    (function(idx) {
      var item = document.createElement('div');
      item.className = 'page-item' + (idx === currentPage ? ' active' : '');
      item.textContent = '📄 Halaman ' + (idx + 1);
      item.addEventListener('click', function() { switchPage(idx); closeSidebar(); });
      pageList.appendChild(item);
    })(i);
  }
}

function switchPage(index) {
  savePage();
  currentPage = index;
  loadPage(index);
  renderPageList();
}

// ─── Canvas Resize ───────────────────────────────────────
function resizeCanvas() {
  var rect = notebookPage.getBoundingClientRect();
  var w = Math.round(rect.width);
  var h = Math.max(Math.round(rect.height), 900);
  if (drawCanvas.width !== w || drawCanvas.height !== h) {
    var tmp = drawCanvas.toDataURL();
    drawCanvas.width  = w;
    drawCanvas.height = h;
    if (tmp && tmp !== 'data:,') {
      var img = new Image();
      img.onload = function() { ctx.drawImage(img, 0, 0); };
      img.src = tmp;
    }
  }
}

// ─── Tool Switch ─────────────────────────────────────────
function setTool(name) {
  currentTool = name;
  var btns = [toolText, toolDraw, toolSign, toolImage, toolErase];
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  drawCanvas.classList.remove('active', 'eraser');
  textLayer.classList.remove('active');
  imageLayer.classList.remove('active');
  drawOptions.style.display = 'none';

  if (name === 'text') {
    toolText.classList.add('active');
    textLayer.classList.add('active');
    mainTextBlock.focus();
  } else if (name === 'draw') {
    toolDraw.classList.add('active');
    drawCanvas.classList.add('active');
    drawOptions.style.display = 'block';
  } else if (name === 'erase') {
    toolErase.classList.add('active');
    drawCanvas.classList.add('active', 'eraser');
    drawOptions.style.display = 'block';
  } else if (name === 'sign') {
    toolSign.classList.add('active');
    openSignPad();
  } else if (name === 'image') {
    toolImage.classList.add('active');
    imageLayer.classList.add('active');
    imageInput.click();
  }
}

toolText.addEventListener('click',  function() { setTool('text');  closeSidebar(); });
toolDraw.addEventListener('click',  function() { setTool('draw');  closeSidebar(); });
toolSign.addEventListener('click',  function() { setTool('sign');  closeSidebar(); });
toolImage.addEventListener('click', function() { setTool('image'); closeSidebar(); });
toolErase.addEventListener('click', function() { setTool('erase'); closeSidebar(); });

// ─── Drawing ─────────────────────────────────────────────
function getPos(e) {
  var rect = drawCanvas.getBoundingClientRect();
  var scaleX = drawCanvas.width  / rect.width;
  var scaleY = drawCanvas.height / rect.height;
  var clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY
  };
}

drawCanvas.addEventListener('mousedown', function(e) {
  if (currentTool !== 'draw' && currentTool !== 'erase') return;
  isDrawing = true;
  var pos = getPos(e);
  lastX = pos.x; lastY = pos.y;
});
drawCanvas.addEventListener('touchstart', function(e) {
  if (currentTool !== 'draw' && currentTool !== 'erase') return;
  e.preventDefault();
  isDrawing = true;
  var pos = getPos(e);
  lastX = pos.x; lastY = pos.y;
}, { passive: false });

drawCanvas.addEventListener('mousemove', function(e) {
  if (!isDrawing) return;
  var pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = penSize;
  if (currentTool === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = penColor;
  }
  ctx.stroke();
  lastX = pos.x; lastY = pos.y;
});
drawCanvas.addEventListener('touchmove', function(e) {
  if (!isDrawing) return;
  e.preventDefault();
  var pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = penSize;
  if (currentTool === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = penColor;
  }
  ctx.stroke();
  lastX = pos.x; lastY = pos.y;
}, { passive: false });

drawCanvas.addEventListener('mouseup',    function() { isDrawing = false; ctx.globalCompositeOperation = 'source-over'; });
drawCanvas.addEventListener('mouseleave', function() { isDrawing = false; ctx.globalCompositeOperation = 'source-over'; });
drawCanvas.addEventListener('touchend',   function() { isDrawing = false; ctx.globalCompositeOperation = 'source-over'; });

penColorInput.addEventListener('input', function(e) { penColor = e.target.value; });
penSizeInput.addEventListener('input', function(e) {
  penSize = parseInt(e.target.value);
  penSizeLabel.textContent = penSize + 'px';
});

// ─── Signature ───────────────────────────────────────────
var signDrawing = false, signLastX = 0, signLastY = 0;

function openSignPad() {
  sctx.clearRect(0, 0, signCanvas.width, signCanvas.height);
  signOverlay.style.display = 'flex';
}

function getSignPos(e) {
  var rect = signCanvas.getBoundingClientRect();
  var sx = signCanvas.width  / rect.width;
  var sy = signCanvas.height / rect.height;
  var cx, cy;
  if (e.touches && e.touches.length > 0) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
  else { cx = e.clientX; cy = e.clientY; }
  return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
}

signCanvas.addEventListener('mousedown',  function(e) { signDrawing = true; var p = getSignPos(e); signLastX = p.x; signLastY = p.y; });
signCanvas.addEventListener('touchstart', function(e) { e.preventDefault(); signDrawing = true; var p = getSignPos(e); signLastX = p.x; signLastY = p.y; }, { passive: false });
signCanvas.addEventListener('mousemove',  function(e) {
  if (!signDrawing) return;
  var p = getSignPos(e);
  sctx.beginPath(); sctx.moveTo(signLastX, signLastY); sctx.lineTo(p.x, p.y);
  sctx.strokeStyle = '#1a1a2e'; sctx.lineWidth = 2.5; sctx.lineCap = 'round'; sctx.stroke();
  signLastX = p.x; signLastY = p.y;
});
signCanvas.addEventListener('touchmove', function(e) {
  e.preventDefault();
  if (!signDrawing) return;
  var p = getSignPos(e);
  sctx.beginPath(); sctx.moveTo(signLastX, signLastY); sctx.lineTo(p.x, p.y);
  sctx.strokeStyle = '#1a1a2e'; sctx.lineWidth = 2.5; sctx.lineCap = 'round'; sctx.stroke();
  signLastX = p.x; signLastY = p.y;
}, { passive: false });
signCanvas.addEventListener('mouseup',  function() { signDrawing = false; });
signCanvas.addEventListener('touchend', function() { signDrawing = false; });

btnClearSign.addEventListener('click', function() { sctx.clearRect(0, 0, signCanvas.width, signCanvas.height); });
btnSaveSign.addEventListener('click', function() {
  placeImage(signCanvas.toDataURL(), 80, 600);
  signOverlay.style.display = 'none';
  setTool('text');
  showToast('Tanda tangan disimpan ✓');
});
btnCancelSign.addEventListener('click', function() {
  signOverlay.style.display = 'none';
  setTool('text');
});

// ─── Image ───────────────────────────────────────────────
imageInput.addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) { placeImage(ev.target.result, 80, 80); showToast('Gambar ditempelkan ✓'); };
  reader.readAsDataURL(file);
  e.target.value = '';
});

document.addEventListener('paste', function(e) {
  var items = e.clipboardData.items;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      var blob = items[i].getAsFile();
      var reader = new FileReader();
      reader.onload = function(ev) { placeImage(ev.target.result, 80, 80); showToast('Gambar dari clipboard ✓'); };
      reader.readAsDataURL(blob);
    }
  }
});

function placeImage(src, x, y) {
  var wrapper = document.createElement('div');
  wrapper.className = 'pasted-image';
  wrapper.style.left = x + 'px';
  wrapper.style.top  = y + 'px';
  var img = document.createElement('img');
  img.src = src;
  img.draggable = false;
  var removeBtn = document.createElement('button');
  removeBtn.className = 'img-remove';
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', function() { wrapper.remove(); });
  wrapper.appendChild(img);
  wrapper.appendChild(removeBtn);
  imageLayer.appendChild(wrapper);
  makeDraggable(wrapper);
}

function makeDraggable(el) {
  var ox = 0, oy = 0, mx = 0, my = 0;
  function dragStart(e) {
    if (e.target.classList.contains('img-remove')) return;
    e.preventDefault();
    mx = e.clientX || e.touches[0].clientX;
    my = e.clientY || e.touches[0].clientY;
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup',   dragEnd);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend',  dragEnd);
  }
  function drag(e) {
    e.preventDefault();
    var cx = e.clientX || e.touches[0].clientX;
    var cy = e.clientY || e.touches[0].clientY;
    ox = mx - cx; oy = my - cy;
    mx = cx; my = cy;
    el.style.left = (el.offsetLeft - ox) + 'px';
    el.style.top  = (el.offsetTop  - oy) + 'px';
  }
  function dragEnd() {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup',   dragEnd);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend',  dragEnd);
  }
  el.addEventListener('mousedown',  dragStart);
  el.addEventListener('touchstart', dragStart, { passive: false });
}

// ─── Page Management ─────────────────────────────────────
btnAddPage.addEventListener('click', function() {
  savePage();
  pages.push(createPage());
  currentPage = pages.length - 1;
  loadPage(currentPage);
  renderPageList();
  showToast('Halaman ' + pages.length + ' ditambahkan ✓');
  closeSidebar();
});

btnPrevPage.addEventListener('click', function() {
  if (currentPage > 0) switchPage(currentPage - 1);
});
btnNextPage.addEventListener('click', function() {
  if (currentPage < pages.length - 1) switchPage(currentPage + 1);
});
btnDeletePage.addEventListener('click', function() {
  if (pages.length <= 1) { showToast('Tidak bisa menghapus halaman terakhir!'); return; }
  if (!confirm('Hapus Halaman ' + (currentPage + 1) + '?')) return;
  pages.splice(currentPage, 1);
  currentPage = Math.min(currentPage, pages.length - 1);
  loadPage(currentPage);
  renderPageList();
  showToast('Halaman dihapus');
});

// ─── Export ──────────────────────────────────────────────
btnExportPNG.addEventListener('click', function() {
  savePage();
  var link = document.createElement('a');
  link.download = 'halaman-' + (currentPage + 1) + '.png';
  link.href = drawCanvas.toDataURL('image/png');
  link.click();
  showToast('PNG tersimpan ✓');
});

// ─── Auto expand ─────────────────────────────────────────
mainTextBlock.addEventListener('input', function() {
  var minH = 900;
  var scrollH = mainTextBlock.scrollHeight + 80;
  if (scrollH > minH) notebookPage.style.minHeight = scrollH + 'px';
});

// ─── Toast ───────────────────────────────────────────────
var toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2200);
}

// ─── Init ────────────────────────────────────────────────
function init() {
  pages.push(createPage());
  resizeCanvas();
  loadPage(0);
  renderPageList();
  setTool('text');
  window.addEventListener('resize', function() { resizeCanvas(); });
}

init();
