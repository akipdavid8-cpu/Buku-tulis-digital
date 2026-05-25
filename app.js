const editor = document.getElementById('editor');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const paper = document.getElementById('paper');
const toast = document.getElementById('toast');
const fontSelect = document.getElementById('fontSelect');
const fontColor = document.getElementById('fontColor');
const fontSize = document.getElementById('fontSize');
const fontSizeLabel = document.getElementById('fontSizeLabel');
const imageInput = document.getElementById('imageInput');
const imageLayer = document.getElementById('imageLayer');
const pageList = document.getElementById('pageList');
const pageTitle = document.getElementById('pageTitle');

let tool = 'text';
let drawing = false;
let pages = [];
let currentPage = 0;

function resizeCanvas(){
  canvas.width = paper.offsetWidth;
  canvas.height = paper.offsetHeight;
}

resizeCanvas();
window.addEventListener('resize',resizeCanvas);

function showToast(text){
  toast.textContent = text;
  toast.classList.add('show');

  setTimeout(()=>{
    toast.classList.remove('show');
  },2000);
}

// TOOL
const toolBtns = document.querySelectorAll('.tool');

toolBtns.forEach(btn=>{
  btn.onclick=()=>{
    toolBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');

    tool = btn.dataset.tool;

    if(tool==='draw' || tool==='erase'){
      canvas.classList.add('active');
    }else{
      canvas.classList.remove('active');
    }
  }
});

// DRAW
canvas.addEventListener('mousedown',start);
canvas.addEventListener('mousemove',draw);
window.addEventListener('mouseup',stop);

canvas.addEventListener('touchstart',start);
canvas.addEventListener('touchmove',draw);
window.addEventListener('touchend',stop);

function getPos(e){
  const rect = canvas.getBoundingClientRect();

  if(e.touches){
    return {
      x:e.touches[0].clientX-rect.left,
      y:e.touches[0].clientY-rect.top
    }
  }

  return {
    x:e.clientX-rect.left,
    y:e.clientY-rect.top
  }
}

function start(e){
  if(tool!=='draw' && tool!=='erase') return;

  drawing=true;
  const pos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(pos.x,pos.y);
}

function draw(e){
  if(!drawing) return;

  const pos = getPos(e);

  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  if(tool==='erase'){
    ctx.globalCompositeOperation='destination-out';
  }else{
    ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle=fontColor.value;
  }

  ctx.lineTo(pos.x,pos.y);
  ctx.stroke();
}

function stop(){
  drawing=false;
}

// FONT
fontSelect.onchange=()=>{
  editor.style.fontFamily = fontSelect.value;
}

fontColor.oninput=()=>{
  editor.style.color = fontColor.value;
}

fontSize.oninput=()=>{
  editor.style.fontSize = fontSize.value+'px';
  fontSizeLabel.textContent = fontSize.value+'px';
}

// THEME
const themeBtn = document.getElementById('themeBtn');

themeBtn.onclick=()=>{
  document.body.classList.toggle('dark');

  if(document.body.classList.contains('dark')){
    themeBtn.textContent='☀️ Light Mode';
  }else{
    themeBtn.textContent='🌙 Dark Mode';
  }
}

// IMAGE
const addImageBtn = document.getElementById('addImageBtn');

addImageBtn.onclick=()=>{
  imageInput.click();
}

imageInput.onchange=(e)=>{
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload=(ev)=>{
    const div = document.createElement('div');
    div.className='pasted-image';
    div.style.left='120px';
    div.style.top='120px';

    div.innerHTML=`<img src="${ev.target.result}">`;

    imageLayer.appendChild(div);

    dragElement(div);

    showToast('Gambar ditambahkan');
  }

  reader.readAsDataURL(file);
}

function dragElement(el){
  let x=0,y=0;

  el.onmousedown=dragMouseDown;

  function dragMouseDown(e){
    e.preventDefault();

    document.onmousemove=elementDrag;
    document.onmouseup=closeDrag;

    x=e.clientX;
    y=e.clientY;
  }

  function elementDrag(e){
    e.preventDefault();

    let dx=x-e.clientX;
    let dy=y-e.clientY;

    x=e.clientX;
    y=e.clientY;

    el.style.top=(el.offsetTop-dy)+'px';
    el.style.left=(el.offsetLeft-dx)+'px';
  }

  function closeDrag(){
    document.onmouseup=null;
    document.onmousemove=null;
  }
}

// TXT SAVE
const saveTxt = document.getElementById('saveTxt');

saveTxt.onclick=()=>{
  const text = pageTitle.value + '\n\n' + editor.innerText;

  const blob = new Blob([text],{type:'text/plain'});

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'catatan.txt';
  a.click();

  showToast('TXT disimpan');
}

// PNG SAVE
const savePng = document.getElementById('savePng');

savePng.onclick=()=>{
  showToast('Gunakan screenshot untuk PNG');
}

// INFO
const infoBtn = document.getElementById('infoBtn');

infoBtn.onclick=()=>{
  alert('Buku Tulis Ultra Pro\n\nFitur:\n- Multi halaman\n- Drawing\n- Dark mode\n- Gaya tulisan\n- Simpan TXT\n- Tempel gambar');
}

// PAGE SYSTEM
function createPage(title='Halaman Baru'){
  return {
    title,
    content:''
  }
}

function renderPages(){
  pageList.innerHTML='';

  pages.forEach((p,i)=>{
    const div=document.createElement('div');
    div.className='pageItem';

    if(i===currentPage){
      div.classList.add('active');
    }

    div.textContent=p.title;

    div.onclick=()=>{
      saveCurrentPage();
      currentPage=i;
      loadPage();
    }

    pageList.appendChild(div);
  })
}

function saveCurrentPage(){
  pages[currentPage].title=pageTitle.value;
  pages[currentPage].content=editor.innerHTML;
}

function loadPage(){
  pageTitle.value=pages[currentPage].title;
  editor.innerHTML=pages[currentPage].content;
  renderPages();
}

document.getElementById('addPage').onclick=()=>{
  saveCurrentPage();

  pages.push(createPage('Halaman '+(pages.length+1)));

  currentPage=pages.length-1;

  loadPage();

  showToast('Halaman baru dibuat');
}

// MENU MOBILE
const menuBtn=document.getElementById('menuBtn');
const sidebar=document.getElementById('sidebar');

menuBtn.onclick=()=>{
  sidebar.classList.toggle('show');
}

// INIT
pages.push(createPage('Halaman 1'));
loadPage();
showToast('Buku Tulis Ultra siap');
