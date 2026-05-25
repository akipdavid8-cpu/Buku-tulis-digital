const state = {
  tool:'text',
  penColor:'#1a1a2e',
  penSize:3
};

/* ELEMENT */

const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');

const toolText = document.getElementById('toolText');
const toolDraw = document.getElementById('toolDraw');
const toolErase = document.getElementById('toolErase');
const toolImage = document.getElementById('toolImage');

const drawCanvas = document.getElementById('drawCanvas');
const ctx = drawCanvas.getContext('2d');

const notebookPage = document.getElementById('notebookPage');

const mainTextBlock = document.getElementById('mainTextBlock');

const penColor = document.getElementById('penColor');
const penSize = document.getElementById('penSize');
const penSizeLabel = document.getElementById('penSizeLabel');

const toast = document.getElementById('toast');

const imageInput = document.getElementById('imageInput');
const imageLayer = document.getElementById('imageLayer');

const btnSaveTxt = document.getElementById('btnSaveTxt');
const btnLoadTxt = document.getElementById('btnLoadTxt');
const txtInput = document.getElementById('txtInput');

const btnHistory = document.getElementById('btnHistory');
const btnInfo = document.getElementById('btnInfo');

const pageTitleInput = document.getElementById('pageTitleInput');

const fontStyleSelect = document.getElementById('fontStyleSelect');

/* RESIZE */

function resizeCanvas(){
  drawCanvas.width = notebookPage.offsetWidth;
  drawCanvas.height = notebookPage.offsetHeight;
}

resizeCanvas();

window.addEventListener('resize',resizeCanvas);

/* TOAST */

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');

  setTimeout(()=>{
    toast.classList.remove('show');
  },2000);
}

/* SIDEBAR */

hamburger.onclick = ()=>{
  sidebar.classList.toggle('show');
};

/* TOOL */

function setTool(name){

  state.tool = name;

  document.querySelectorAll('.tool-btn')
  .forEach(btn=>btn.classList.remove('active'));

  if(name==='text') toolText.classList.add('active');
  if(name==='draw') toolDraw.classList.add('active');
  if(name==='erase') toolErase.classList.add('active');
  if(name==='image') toolImage.classList.add('active');

}

toolText.onclick = ()=>setTool('text');
toolDraw.onclick = ()=>setTool('draw');
toolErase.onclick = ()=>setTool('erase');

toolImage.onclick = ()=>{

  setTool('image');

  imageInput.click();
};

/* FONT */

fontStyleSelect.onchange = ()=>{

  mainTextBlock.style.fontFamily =
  fontStyleSelect.value;

  showToast('Gaya tulisan diubah ✓');
};

/* PEN */

penColor.oninput = ()=>{
  state.penColor = penColor.value;
};

penSize.oninput = ()=>{
  state.penSize = penSize.value;
  penSizeLabel.textContent =
  state.penSize + 'px';
};

/* DRAW */

let drawing = false;

function getPos(e){

  const rect = drawCanvas.getBoundingClientRect();

  const x =
  (e.clientX || e.touches[0].clientX)
  - rect.left;

  const y =
  (e.clientY || e.touches[0].clientY)
  - rect.top;

  return {x,y};
}

drawCanvas.addEventListener('mousedown',startDraw);
drawCanvas.addEventListener('touchstart',startDraw);

function startDraw(e){

  if(state.tool!=='draw' &&
     state.tool!=='erase') return;

  drawing = true;

  const pos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(pos.x,pos.y);
}

drawCanvas.addEventListener('mousemove',draw);
drawCanvas.addEventListener('touchmove',draw);

function draw(e){

  if(!drawing) return;

  const pos = getPos(e);

  ctx.lineWidth = state.penSize;
  ctx.lineCap = 'round';

  if(state.tool==='erase'){
    ctx.globalCompositeOperation =
    'destination-out';
  }else{
    ctx.globalCompositeOperation =
    'source-over';

    ctx.strokeStyle =
    state.penColor;
  }

  ctx.lineTo(pos.x,pos.y);
  ctx.stroke();
}

window.addEventListener('mouseup',()=>{
  drawing = false;
});

window.addEventListener('touchend',()=>{
  drawing = false;
});

/* IMAGE */

imageInput.addEventListener('change',e=>{

  const file = e.target.files[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = ev=>{

    addImage(ev.target.result);

    showToast('Gambar berhasil ditambahkan ✓');
  };

  reader.readAsDataURL(file);
});

function addImage(src){

  const wrap = document.createElement('div');

  wrap.className = 'pasted-image';

  wrap.style.left = '100px';
  wrap.style.top = '120px';

  wrap.innerHTML =
  `<img src="${src}">`;

  imageLayer.appendChild(wrap);

  dragElement(wrap);
}

/* DRAG IMAGE */

function dragElement(el){

  let x=0,y=0;

  el.onmousedown = dragMouseDown;
  el.ontouchstart = dragMouseDown;

  function dragMouseDown(e){

    e.preventDefault();

    const clientX =
    e.clientX || e.touches[0].clientX;

    const clientY =
    e.clientY || e.touches[0].clientY;

    x = clientX;
    y = clientY;

    document.onmousemove = elementDrag;
    document.onmouseup = stopDrag;

    document.ontouchmove = elementDrag;
    document.ontouchend = stopDrag;
  }

  function elementDrag(e){

    e.preventDefault();

    const clientX =
    e.clientX || e.touches[0].clientX;

    const clientY =
    e.clientY || e.touches[0].clientY;

    el.style.top =
    (el.offsetTop + clientY - y) + "px";

    el.style.left =
    (el.offsetLeft + clientX - x) + "px";

    x = clientX;
    y = clientY;
  }

  function stopDrag(){

    document.onmouseup = null;
    document.onmousemove = null;

    document.ontouchmove = null;
    document.ontouchend = null;
  }
}

/* SAVE TXT */

btnSaveTxt.onclick = ()=>{

  const blob = new Blob(
    [mainTextBlock.innerText],
    {type:'text/plain'}
  );

  const a = document.createElement('a');

  a.href = URL.createObjectURL(blob);

  a.download =
  (pageTitleInput.value || 'catatan')
  + '.txt';

  a.click();

  showToast('TXT berhasil disimpan ✓');
};

/* LOAD TXT */

btnLoadTxt.onclick = ()=>{
  txtInput.click();
};

txtInput.addEventListener('change',e=>{

  const file = e.target.files[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = ev=>{

    mainTextBlock.innerText =
    ev.target.result;

    showToast('TXT berhasil dimuat ✓');
  };

  reader.readAsText(file);
});

/* HISTORY */

btnHistory.onclick = ()=>{

  const note =
  mainTextBlock.innerText;

  localStorage.setItem(
    'history_note',
    note
  );

  showToast('Riwayat disimpan ✓');
};

/* INFO */

btnInfo.onclick = ()=>{

  alert(
`BUKU TULIS DIGITAL PRO

Fitur:
✓ 30 gaya tulisan
✓ Upload gambar
✓ Simpan TXT
✓ Upload TXT
✓ Gambar bebas
✓ Penghapus
✓ Riwayat catatan
✓ Mobile friendly

Versi: PRO`
  );
};

/* TITLE */

pageTitleInput.oninput = ()=>{

  document.getElementById(
    'currentPageLabel'
  ).textContent =
  pageTitleInput.value || 'Tanpa Judul';
};
