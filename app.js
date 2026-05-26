
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 50;

let drawing = false;
let tool = "pen";
let color = "#000000";
let pages = {};
let currentPage = "page1";

// SIDEBAR
document.getElementById("menuBtn").onclick = () => {
  let sb = document.getElementById("sidebar");
  sb.style.left = sb.style.left === "0px" ? "-260px" : "0px";
};

// DRAW
canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mousemove", draw);

function start(e) {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.clientX, e.clientY - 50);
}

function stop() {
  drawing = false;
}

function draw(e) {
  if (!drawing) return;

  if (tool === "eraser") {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 20;
  } else if (tool === "brush") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
  } else {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
  }

  ctx.lineTo(e.clientX, e.clientY - 50);
  ctx.stroke();
}

// TOOL
function setTool(t) {
  tool = t;
}

// COLOR
function setColor(c) {
  color = c;
}

// PAGE
function newPage() {
  currentPage = "page" + Date.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("pageTitle").value = "";
}

// SAVE
function savePage() {
  pages[currentPage] = canvas.toDataURL();
  localStorage.setItem("pages", JSON.stringify(pages));
  loadHistory();
}

// LOAD HISTORY
function loadHistory() {
  let history = document.getElementById("history");
  history.innerHTML = "";

  for (let key in pages) {
    let btn = document.createElement("button");
    btn.innerText = key;
    btn.onclick = () => loadPage(key);
    history.appendChild(btn);
  }
}

// LOAD PAGE
function loadPage(key) {
  let img = new Image();
  img.src = pages[key];
  img.onload = () => ctx.drawImage(img, 0, 0);
}

// IMAGE UPLOAD
function uploadImage(e) {
  let file = e.target.files[0];
  let img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    ctx.drawImage(img, 50, 50, 200, 200);
  };
}

// PDF UPLOAD (simple view)
function uploadPDF(e) {
  alert("PDF diupload (fitur preview sederhana).");
}

// EXPORT PDF
function exportPDF() {
  const img = canvas.toDataURL("image/png");
  let win = window.open();
  win.document.write(`<img src="${img}" />`);
}

// INIT
window.onload = () => {
  pages = JSON.parse(localStorage.getItem("pages")) || {};
  loadHistory();
};
