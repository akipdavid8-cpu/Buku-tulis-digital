/* ===========================
   BUKU TULIS DIGITAL - JS FIXED
   =========================== */

// ─── State ───────────────────────────────────────────────
const state = {
  pages: [],
  currentPage: 0,
  tool: 'text',
  penColor: '#1a1a2e',
  penSize: 3,
  drawing: false,
  lastX: 0,
  lastY: 0,

  // 🔥 UNDO / REDO STACK
  undoStack: [],
  redoStack: []
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

// Undo/Redo buttons
const btnUndo = document.getElementById('btnUndo');
const btnRedo = document.getElementById('btnRedo');

// ─── Canvas ctx ──────────────────────────────────────────
const ctx = drawCanvas.getContext('2d');
const sctx = signCanvas.getContext('2d');

// ─── PAGE DATA ───────────────────────────────────────────
function createPage() {
  return {
    canvasData: null,
    textContent: '',
    images: []
  };
}

// ─── SAVE STATE (UNDO SUPPORT) ───────────────────────────
function pushHistory() {
  const snapshot = {
    canvas: drawCanvas.toDataURL(),
    text: mainTextBlock.innerHTML,
    images: imageLayer.innerHTML
  };

  state.undoStack.push(snapshot);
  if (state.undoStack.length > 30) state.undoStack.shift();

  state.redoStack = [];
}

// ─── UNDO ────────────────────────────────────────────────
function undo() {
  if (!state.undoStack.length) return;

  const current = {
    canvas: drawCanvas.toDataURL(),
    text: mainTextBlock.innerHTML,
    images: imageLayer.innerHTML
  };
  state.redoStack.push(current);

  const prev = state.undoStack.pop();
  restoreSnapshot(prev);
}

// ─── REDO ────────────────────────────────────────────────
function redo() {
  if (!state.redoStack.length) return;

  const current = {
    canvas: drawCanvas.toDataURL(),
    text: mainTextBlock.innerHTML,
    images: imageLayer.innerHTML
  };
  state.undoStack.push(current);

  const next = state.redoStack.pop();
  restoreSnapshot(next);
}

// ─── RESTORE SNAPSHOT ────────────────────────────────────
function restoreSnapshot(s) {
  if (!s) return;

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = s.canvas;

  mainTextBlock.innerHTML = s.text;
  imageLayer.innerHTML = s.images;
}

// ─── PAGE SYSTEM ─────────────────────────────────────────
function switchPage(index) {
  savePage();
  state.currentPage = index;
  loadPage(index);
  renderPageList();
}

// ─── SAVE PAGE ───────────────────────────────────────────
function savePage() {
  pushHistory();

  const p = state.pages[state.currentPage];
  if (!p) return;

  p.canvasData = drawCanvas.toDataURL();
  p.textContent = mainTextBlock.innerHTML;
  p.images = imageLayer.innerHTML;
}

// ─── LOAD PAGE ───────────────────────────────────────────
function loadPage(index) {
  const p = state.pages[index];
  if (!p) return;

  resizeCanvas();
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

  if (p.canvasData) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = p.canvasData;
  }

  mainTextBlock.innerHTML = p.textContent || '';
  imageLayer.innerHTML = p.images || '';

  currentPageLbl.textContent = `Halaman ${index + 1}`;
}

// ─── RENDER PAGE LIST ────────────────────────────────────
function renderPageList() {
  pageList.innerHTML = '';
  state.pages.forEach((_, i) => {
    const el = document.createElement('div');
    el.className = 'page-item' + (i === state.currentPage ? ' active' : '');
    el.textContent = `📄 Halaman ${i + 1}`;
    el.onclick = () => switchPage(i);
    pageList.appendChild(el);
  });
}

// ─── CANVAS RESIZE ───────────────────────────────────────
function resizeCanvas() {
  const rect = notebookPage.getBoundingClientRect();
  drawCanvas.width = rect.width;
  drawCanvas.height = rect.height;
}

// ─── DRAWING ─────────────────────────────────────────────
function getPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  return {
    x: (e.clientX || e.touches[0].clientX) - rect.left,
    y: (e.clientY || e.touches[0].clientY) - rect.top
  };
}

function startDraw(e) {
  if (state.tool !== 'draw' && state.tool !== 'erase') return;

  pushHistory();

  state.drawing = true;
  const p = getPos(e);
  state.lastX = p.x;
  state.lastY = p.y;
}

function moveDraw(e) {
  if (!state.drawing) return;

  const p = getPos(e);

  ctx.beginPath();
  ctx.moveTo(state.lastX, state.lastY);
  ctx.lineTo(p.x, p.y);

  ctx.lineWidth = state.penSize;
  ctx.strokeStyle = state.tool === 'erase' ? '#fff' : state.penColor;
  ctx.globalCompositeOperation = state.tool === 'erase'
    ? 'destination-out'
    : 'source-over';

  ctx.stroke();

  state.lastX = p.x;
  state.lastY = p.y;
}

function endDraw() {
  state.drawing = false;
  ctx.globalCompositeOperation = 'source-over';
}

// ─── EVENTS ──────────────────────────────────────────────
drawCanvas.addEventListener('mousedown', startDraw);
drawCanvas.addEventListener('mousemove', moveDraw);
drawCanvas.addEventListener('mouseup', endDraw);
drawCanvas.addEventListener('mouseleave', endDraw);

drawCanvas.addEventListener('touchstart', startDraw, { passive: false });
drawCanvas.addEventListener('touchmove', moveDraw, { passive: false });
drawCanvas.addEventListener('touchend', endDraw);

// ─── TOOL BUTTONS ────────────────────────────────────────
toolDraw.onclick = () => state.tool = 'draw';
toolText.onclick = () => state.tool = 'text';
toolErase.onclick = () => state.tool = 'erase';

// ─── UNDO / REDO BUTTONS ────────────────────────────────
btnUndo.onclick = undo;
btnRedo.onclick = redo;

// ─── HAMBURGER FIX ───────────────────────────────────────
hamburger.onclick = () => {
  sidebar.classList.toggle('hidden');
  main.classList.toggle('full');
};

// ─── INIT ────────────────────────────────────────────────
function init() {
  state.pages.push(createPage());
  resizeCanvas();
  loadPage(0);
  renderPageList();
}

init();
