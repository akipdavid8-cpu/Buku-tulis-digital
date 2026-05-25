/* ===========================
   BUKU TULIS DIGITAL - JS
   =========================== */

// ─── State ───────────────────────────────────────────────
const state = {
  pages: [],          // Array of page data
  currentPage: 0,     // Index
  tool: 'text',       // text | draw | sign | image | erase
  penColor: '#1a1a2e',
  penSize: 3,
  drawing: false,
  lastX: 0,
  lastY: 0,
};

// ─── DOM ─────────────────────────────────────────────────
const pageList       = document.getElementById('pageList');
const btnAddPage     = document.getElementById('btnAddPage');
const btnPrevPage    = document.getElementById('btnPrevPage');
const btnNextPage    = document.getElementById('btnNextPage');
const btnDeletePage  = document.getElementById('btnDeletePage');
const currentPageLbl = document.getElementById('currentPageLabel');

const notebookPage  = document.getElementById('notebookPage');
const drawCanvas    = document.getElementById('drawCanvas');
const textLayer     = document.getElementById('textLayer');
const mainTextBlock = document.getElementById('mainTextBlock');
const imageLayer    = document.getElementById('imageLayer');
const imageInput    = document.getElementById('imageInput');
const signOverlay   = document.getElementById('signOverlay');
const signCanvas    = document.getElementById('signCanvas');

const toolText  = document.getElementById('toolText');
const toolDraw  = document.getElementById('toolDraw');
const toolSign  = document.getElementById('toolSign');
const toolImage = document.getElementById('toolImage');
const toolErase = document.getElementById('toolErase');

const drawOptions = document.getElementById('drawOptions');
const penColor    = document.getElementById('penColor');
const penSize     = document.getElementById('penSize');
const penSizeLabel= document.getElementById('penSizeLabel');

const btnExportPNG = document.getElementById('btnExportPNG');
const btnExportPDF = document.getElementById('btnExportPDF');
const toast        = document.getElementById('toast');
const hamburger    = document.getElementById('hamburger');
const sidebar      = document.getElementById('sidebar');
const main         = document.getElementById('main');

// Signature
const btnClearSign  = document.getElementById('btnClearSign');
const btnSaveSign   = document.getElementById('btnSaveSign');
const btnCancelSign = document.getElementById('btnCancelSign');

// ─── Canvas ctx ──────────────────────────────────────────
const ctx = drawCanvas.getContext('2d');
const sctx = signCanvas.getContext('2d');

// ─── Page Data ───────────────────────────────────────────
function createPage() {
  return {
    canvasData: null,   // ImageData URL
    textContent: '',    // HTML content
    images: [],         // [{src, x, y}]
  };
}

function savePage() {
  const p = state.pages[state.currentPage];
  if (!p) return;
  p.canvasData   = drawCanvas.toDataURL();
  p.textContent  = mainTextBlock.innerHTML;
  p.images       = [];
  imageLayer.querySelectorAll('.pasted-image').forEach(el => {
    p.images.push({
      src: el.querySelector('img').src,
      x: parseInt(el.style.left) || 50,
      y: parseInt(el.style.top)  || 50,
      w: el.offsetWidth,
      h: el.offsetHeight,
    });
  });
}

function loadPage(index) {
  const p = state.pages[index];
  if (!p) return;

  // Resize canvas
  resizeCanvas();

  // Clear canvas
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

  // Restore canvas drawing
  if (p.canvasData) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = p.canvasData;
  }

  // Restore text
  mainTextBlock.innerHTML = p.textContent || '';

  // Restore images
  imageLayer.innerHTML = '';
  (p.images || []).forEach(imgData => {
    placeImage(imgData.src, imgData.x, imgData.y);
  });

  currentPageLbl.textContent = `Halaman ${index + 1}`;
}

function renderPageList() {
  pageList.innerHTML = '';
  state.pages.forEach((_, i) => {
    const item = document.createElement('div');
    item.className = 'page-item' + (i === state.currentPage ? ' active' : '');
    item.textContent = `📄 Halaman ${i + 1}`;
    item.addEventListener('click', () => switchPage(i));
    pageList.appendChild(item);
  });
}

function switchPage(index) {
  savePage();
  state.currentPage = index;
  loadPage(index);
  renderPageList();
}

// ─── Canvas Resize ───────────────────────────────────────
function resizeCanvas() {
  const rect = notebookPage.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.max(Math.round(rect.height), 900);
  if (drawCanvas.width !== w || drawCanvas.height !== h) {
    // Preserve drawing
    const tmp = drawCanvas.toDataURL();
    drawCanvas.width  = w;
    drawCanvas.height = h;
    if (tmp && tmp !== 'data:,') {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = tmp;
    }
  }
}

// ─── Tool switching ──────────────────────────────────────
const toolBtns = [toolText, toolDraw, toolSign, toolImage, toolErase];

function setTool(name) {
  state.tool = name;
  toolBtns.forEach(b => b.classList.remove('active'));
  drawCanvas.classList.remove('active', 'eraser');
  textLayer.classList.remove('active');
  imageLayer.classList.remove('active');
  drawOptions.style.display = 'none';

  switch (name) {
    case 'text':
      toolText.classList.add('active');
      textLayer.classList.add('active');
      mainTextBlock.focus();
      break;
    case 'draw':
      toolDraw.classList.add('active');
      drawCanvas.classList.add('active');
      drawOptions.style.display = 'block';
      break;
    case 'erase':
      toolErase.classList.add('active');
      drawCanvas.classList.add('active', 'eraser');
      drawOptions.style.display = 'block';
      break;
    case 'sign':
      toolSign.classList.add('active');
      openSignPad();
      break;
    case 'image':
      toolImage.classList.add('active');
      imageLayer.classList.add('active');
      imageInput.click();
      break;
  }
}

toolText.addEventListener('click',  () => setTool('text'));
toolDraw.addEventListener('click',  () => setTool('draw'));
toolSign.addEventListener('click',  () => setTool('sign'));
toolImage.addEventListener('click', () => setTool('image'));
toolErase.addEventListener('click', () => setTool('erase'));

// ─── Drawing ─────────────────────────────────────────────
function getPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width  / rect.width;
  const scaleY = drawCanvas.height / rect.height;
  let clientX, clientY;
  if (e.touches) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
  };
}

function startDraw(e) {
  if (!['draw','erase'].includes(state.tool)) return;
  e.preventDefault();
  state.drawing = true;
  const {x, y} = getPos(e);
  state.lastX = x;
  state.lastY = y;
  ctx.beginPath();
  ctx.arc(x, y, state.penSize / 2, 0, Math.PI * 2);
  if (state.tool === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = state.penColor;
  }
  ctx.fill();
}

function moveDraw(e) {
  if (!state.drawing) return;
  e.preventDefault();
  const {x, y} = getPos(e);
  ctx.beginPath();
  ctx.moveTo(state.lastX, state.lastY);
  ctx.lineTo(x, y);
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = state.penSize;
  if (state.tool === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = state.penColor;
  }
  ctx.stroke();
  state.lastX = x;
  state.lastY = y;
}

function endDraw() {
  state.drawing = false;
  ctx.globalCompositeOperation = 'source-over';
}

drawCanvas.addEventListener('mousedown',  startDraw);
drawCanvas.addEventListener('mousemove',  moveDraw);
drawCanvas.addEventListener('mouseup',    endDraw);
drawCanvas.addEventListener('mouseleave', endDraw);
drawCanvas.addEventListener('touchstart', startDraw, { passive: false });
drawCanvas.addEventListener('touchmove',  moveDraw,  { passive: false });
drawCanvas.addEventListener('touchend',   endDraw);

// Pen options
penColor.addEventListener('input', e => state.penColor = e.target.value);
penSize.addEventListener('input', e => {
  state.penSize = parseInt(e.target.value);
  penSizeLabel.textContent = state.penSize + 'px';
});

// ─── Signature Pad ───────────────────────────────────────
let signDrawing = false, signLastX = 0, signLastY = 0;

function openSignPad() {
  sctx.clearRect(0, 0, signCanvas.width, signCanvas.height);
  signOverlay.style.display = 'flex';
}

function getSignPos(e) {
  const rect = signCanvas.getBoundingClientRect();
  const sx = signCanvas.width  / rect.width;
  const sy = signCanvas.height / rect.height;
  let cx, cy;
  if (e.touches) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
  else           { cx = e.clientX;             cy = e.clientY; }
  return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
}

signCanvas.addEventListener('mousedown',  e => { signDrawing = true; const p = getSignPos(e); signLastX = p.x; signLastY = p.y; });
signCanvas.addEventListener('touchstart', e => { e.preventDefault(); signDrawing = true; const p = getSignPos(e); signLastX = p.x; signLastY = p.y; }, { passive: false });

signCanvas.addEventListener('mousemove', e => {
  if (!signDrawing) return;
  const {x, y} = getSignPos(e);
  sctx.beginPath();
  sctx.moveTo(signLastX, signLastY);
  sctx.lineTo(x, y);
  sctx.strokeStyle = '#1a1a2e';
  sctx.lineWidth = 2.5;
  sctx.lineCap = 'round';
  sctx.stroke();
  signLastX = x; signLastY = y;
});
signCanvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!signDrawing) return;
  const {x, y} = getSignPos(e);
  sctx.beginPath();
  sctx.moveTo(signLastX, signLastY);
  sctx.lineTo(x, y);
  sctx.strokeStyle = '#1a1a2e';
  sctx.lineWidth = 2.5;
  sctx.lineCap = 'round';
  sctx.stroke();
  signLastX = x; signLastY = y;
}, { passive: false });

signCanvas.addEventListener('mouseup',  () => signDrawing = false);
signCanvas.addEventListener('touchend', () => signDrawing = false);

btnClearSign.addEventListener('click', () => sctx.clearRect(0, 0, signCanvas.width, signCanvas.height));

btnSaveSign.addEventListener('click', () => {
  const dataUrl = signCanvas.toDataURL();
  placeImage(dataUrl, 80, 600);
  signOverlay.style.display = 'none';
  setTool('text');
  showToast('Tanda tangan disimpan ✓');
});

btnCancelSign.addEventListener('click', () => {
  signOverlay.style.display = 'none';
  setTool('text');
});

// ─── Image Paste ─────────────────────────────────────────
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    placeImage(ev.target.result, 80, 80);
    showToast('Gambar ditempelkan ✓');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

// Drag-to-paste from clipboard
document.addEventListener('paste', e => {
  const items = e.clipboardData.items;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = ev => placeImage(ev.target.result, 80, 80);
      reader.readAsDataURL(blob);
      showToast('Gambar ditempelkan dari clipboard ✓');
    }
  }
});

function placeImage(src, x, y) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pasted-image';
  wrapper.style.left = x + 'px';
  wrapper.style.top  = y + 'px';

  const img = document.createElement('img');
  img.src = src;
  img.draggable = false;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'img-remove';
  removeBtn.textContent = '✕';
  removeBtn.title = 'Hapus gambar';
  removeBtn.addEventListener('click', () => wrapper.remove());

  wrapper.appendChild(img);
  wrapper.appendChild(removeBtn);
  imageLayer.appendChild(wrapper);

  makeDraggable(wrapper);
}

function makeDraggable(el) {
  let ox = 0, oy = 0, mx = 0, my = 0;

  function dragStart(e) {
    if (e.target.classList.contains('img-remove')) return;
    e.preventDefault();
    mx = e.clientX || e.touches[0].clientX;
    my = e.clientY || e.touches[0].clientY;
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);
  }

  function drag(e) {
    e.preventDefault();
    const cx = e.clientX || e.touches[0].clientX;
    const cy = e.clientY || e.touches[0].clientY;
    ox = mx - cx; oy = my - cy;
    mx = cx; my = cy;
    el.style.left = (el.offsetLeft - ox) + 'px';
    el.style.top  = (el.offsetTop  - oy) + 'px';
  }

  function dragEnd() {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', dragEnd);
  }

  el.addEventListener('mousedown',  dragStart);
  el.addEventListener('touchstart', dragStart, { passive: false });
}

// ─── Page Management ─────────────────────────────────────
btnAddPage.addEventListener('click', () => {
  savePage();
  state.pages.push(createPage());
  state.currentPage = state.pages.length - 1;
  loadPage(state.currentPage);
  renderPageList();
  showToast(`Halaman ${state.pages.length} ditambahkan ✓`);
});

btnPrevPage.addEventListener('click', () => {
  if (state.currentPage > 0) switchPage(state.currentPage - 1);
});

btnNextPage.addEventListener('click', () => {
  if (state.currentPage < state.pages.length - 1) switchPage(state.currentPage + 1);
});

btnDeletePage.addEventListener('click', () => {
  if (state.pages.length <= 1) { showToast('Tidak bisa menghapus halaman terakhir!'); return; }
  if (!confirm(`Hapus Halaman ${state.currentPage + 1}?`)) return;
  state.pages.splice(state.currentPage, 1);
  state.currentPage = Math.min(state.currentPage, state.pages.length - 1);
  loadPage(state.currentPage);
  renderPageList();
  showToast('Halaman dihapus');
});

// ─── Export ──────────────────────────────────────────────
btnExportPNG.addEventListener('click', () => {
  savePage();
  exportCurrentPage();
});

function exportCurrentPage() {
  const rect = notebookPage.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = notebookPage.scrollHeight || Math.round(rect.height);

  const offCanvas = document.createElement('canvas');
  offCanvas.width  = w;
  offCanvas.height = h;
  const offCtx = offCanvas.getContext('2d');

  // White background
  offCtx.fillStyle = '#fdfaf3';
  offCtx.fillRect(0, 0, w, h);

  // Draw lines
  offCtx.strokeStyle = '#e8e0cc';
  offCtx.lineWidth = 1;
  for (let y = 40 + 32; y < h; y += 32) {
    offCtx.beginPath();
    offCtx.moveTo(0, y);
    offCtx.lineTo(w, y);
    offCtx.stroke();
  }

  // Margin line
  offCtx.strokeStyle = 'rgba(220,100,100,0.35)';
  offCtx.lineWidth = 1.5;
  offCtx.beginPath();
  offCtx.moveTo(72, 0);
  offCtx.lineTo(72, h);
  offCtx.stroke();

  // Draw canvas layer
  offCtx.drawImage(drawCanvas, 0, 0);

  // Text (via foreignObject in SVG)
  const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="
        font-family: 'Caveat', cursive;
        font-size: 20px;
        line-height: 32px;
        color: #1a1a2e;
        position: absolute;
        top: 48px;
        left: 84px;
        right: 30px;
        white-space: pre-wrap;
        word-break: break-word;
      ">${mainTextBlock.innerHTML}</div>
    </foreignObject>
  </svg>`;

  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl  = URL.createObjectURL(svgBlob);
  const svgImg  = new Image();

  svgImg.onload = () => {
    offCtx.drawImage(svgImg, 0, 0);
    URL.revokeObjectURL(svgUrl);

    // Images
    const imgEls = imageLayer.querySelectorAll('.pasted-image');
    let pending = imgEls.length;

    function finalExport() {
      const link = document.createElement('a');
      link.download = `halaman-${state.currentPage + 1}.png`;
      link.href = offCanvas.toDataURL('image/png');
      link.click();
      showToast('PNG tersimpan ✓');
    }

    if (!pending) { finalExport(); return; }
    imgEls.forEach(wrapper => {
      const img = wrapper.querySelector('img');
      const x   = parseInt(wrapper.style.left) || 0;
      const y   = parseInt(wrapper.style.top)  || 0;
      const pImg = new Image();
      pImg.crossOrigin = 'anonymous';
      pImg.onload = () => {
        offCtx.drawImage(pImg, x, y, pImg.naturalWidth > 300 ? 300 : pImg.naturalWidth, pImg.naturalHeight > 300 ? 300 : pImg.naturalHeight);
        pending--;
        if (!pending) finalExport();
      };
      pImg.onerror = () => { pending--; if (!pending) finalExport(); };
      pImg.src = img.src;
    });
  };
  svgImg.src = svgUrl;
}

btnExportPDF.addEventListener('click', () => {
  showToast('Untuk PDF, gunakan Print > Save as PDF di browser Anda');
  setTimeout(() => window.print(), 500);
});

// ─── Hamburger ───────────────────────────────────────────
hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('visible');
  main.classList.toggle('full');
});

// ─── Toast ───────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── Auto-expand page height ─────────────────────────────
mainTextBlock.addEventListener('input', () => {
  const minH = 900;
  const scrollH = mainTextBlock.scrollHeight + 80;
  if (scrollH > minH) {
    notebookPage.style.minHeight = scrollH + 'px';
  }
});

// ─── Init ────────────────────────────────────────────────
function init() {
  state.pages.push(createPage());
  resizeCanvas();
  loadPage(0);
  renderPageList();
  setTool('text');

  // Keyboard shortcut hints
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'd': e.preventDefault(); setTool('draw'); break;
        case 't': e.preventDefault(); setTool('text'); break;
        case 'e': e.preventDefault(); setTool('erase'); break;
      }
    }
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    const p = state.pages[state.currentPage];
    if (p && p.canvasData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = p.canvasData;
    }
  });
}

init();
