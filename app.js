const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// ================= STATE =================
let drawing = false;
let tool = "pen";

let color = "#000000";
let size = 3;

let pages = [];
let currentPage = 0;

let undoStack = [];
let redoStack = [];

// ================= CANVAS SIZE =================
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  loadPage(currentPage);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ================= TOOL =================
function setTool(t) {
  tool = t;
}

function setColor(c) {
  color = c;
}

function setSize(s) {
  size = parseInt(s);
}

// ================= POSITION =================
function getPos(e) {
  const rect = canvas.getBoundingClientRect();

  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }

  return {
    x: e.offsetX,
    y: e.offsetY
  };
}

// ================= DRAW =================
function startDraw(e) {
  drawing = true;

  saveState();

  const pos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);

  e.preventDefault();
}

function draw(e) {
  if (!drawing) return;

  const pos = getPos(e);

  ctx.lineCap = "round";

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = size * 2;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;

    if (tool === "pen") {
      ctx.lineWidth = size * 0.7;
    }

    if (tool === "pencil") {
      ctx.lineWidth = size;
    }
  }

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  e.preventDefault();
}

function stopDraw() {
  drawing = false;
}

// ================= EVENT PC =================
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);

// ================= EVENT HP =================
canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", stopDraw);

// ================= UNDO =================
function saveState() {
  undoStack.push(canvas.toDataURL());

  if (undoStack.length > 20) {
    undoStack.shift();
  }

  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;

  redoStack.push(canvas.toDataURL());

  const img = new Image();
  img.src = undoStack.pop();

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

function redo() {
  if (redoStack.length === 0) return;

  const img = new Image();
  img.src = redoStack.pop();

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

// ================= PAGE SYSTEM =================
function savePage() {
  pages[currentPage] = canvas.toDataURL();
  saveLocal();
}

function loadPage(index) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!pages[index]) return;

  const img = new Image();
  img.src = pages[index];

  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };
}

function addPage() {
  savePage();

  currentPage++;

  if (!pages[currentPage]) {
    pages[currentPage] = null;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  alert("Halaman baru dibuat");
}

function newNote() {
  pages = [];
  currentPage = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  saveLocal();
}

// ================= IMAGE =================
function addImage(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const img = new Image();

    img.src = e.target.result;

    img.onload = function() {
      ctx.drawImage(img, 50, 50, 200, 200);
    };
  };

  reader.readAsDataURL(file);
}

// ================= PDF =================
function savePDF() {
  savePage();

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pages.forEach((page, index) => {
    if (!page) return;

    pdf.addImage(page, "PNG", 10, 10, 180, 250);

    if (index < pages.length - 1) {
      pdf.addPage();
    }
  });

  const title =
    document.getElementById("title").value || "catatan";

  pdf.save(title + ".pdf");
}

// ================= LOCAL STORAGE =================
function saveLocal() {
  localStorage.setItem(
    "smart_notes_pages",
    JSON.stringify(pages)
  );
}

function loadLocal() {
  const data = localStorage.getItem(
    "smart_notes_pages"
  );

  if (data) {
    pages = JSON.parse(data);

    loadPage(0);
  }
}

// ================= AUTO SAVE =================
window.addEventListener("beforeunload", () => {
  savePage();
});

// ================= INIT =================
window.onload = () => {
  loadLocal();
};
