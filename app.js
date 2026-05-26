const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;

// MODE: pen = menulis, pencil = gambar, eraser = hapus
let tool = "pen";

let color = "#000000";
let size = 3;

// ================= DATA =================
let pages = [];
let currentPage = 0;

let undoStack = [];
let redoStack = [];

// ================= RESIZE =================
function resize() {
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.85;
}
resize();
window.addEventListener("resize", resize);

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

// ================= DRAW SYSTEM =================
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mousemove", draw);

function startDraw(e) {
  drawing = true;

  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);

  saveState();
}

function stopDraw() {
  drawing = false;
}

function draw(e) {
  if (!drawing) return;

  ctx.lineCap = "round";

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = size * 2;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;

    if (tool === "pen") {
      // lebih halus untuk tulisan
      ctx.lineWidth = size * 0.7;
    } else {
      // pencil / gambar
      ctx.lineWidth = size;
    }
  }

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
}

// ================= UNDO / REDO =================
function saveState() {
  undoStack.push(canvas.toDataURL());
  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;

  redoStack.push(canvas.toDataURL());

  let img = new Image();
  img.src = undoStack.pop();

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

function redo() {
  if (redoStack.length === 0) return;

  let img = new Image();
  img.src = redoStack.pop();

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

// ================= CLEAR =================
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ================= IMAGE UPLOAD =================
function addImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;

    img.onload = function () {
      ctx.drawImage(img, 50, 50, 200, 200);
    };
  };

  reader.readAsDataURL(file);
}

// ================= NOTE SYSTEM =================
function newNote() {
  savePage();
  pages = [];
  currentPage = 0;
  clearCanvas();
  saveLocal();
}

function addPage() {
  savePage();
  clearCanvas();
  currentPage++;
}

function savePage() {
  pages[currentPage] = canvas.toDataURL();
  saveLocal();
}

function loadPage(index) {
  if (!pages[index]) return;

  let img = new Image();
  img.src = pages[index];

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

// ================= PDF EXPORT =================
function savePDF() {
  savePage();

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pages.forEach((p, i) => {
    if (p) {
      pdf.addImage(p, "PNG", 10, 10, 180, 160);
      if (i < pages.length - 1) pdf.addPage();
    }
  });

  const title = document.getElementById("title")?.value || "catatan";
  pdf.save(`${title}.pdf`);
}

// ================= LOCAL STORAGE =================
function saveLocal() {
  localStorage.setItem("smart_notes", JSON.stringify(pages));
}

function loadLocal() {
  const data = localStorage.getItem("smart_notes");

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
window.onload = function () {
  loadLocal();
};
