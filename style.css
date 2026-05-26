* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

/* ================= BODY ================= */
body {
  background: #1e1e2f;
  color: white;
  overflow: hidden;
}

/* ================= TOOLBAR ================= */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  align-items: center;
}

/* BUTTON STYLE */
button {
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: #2d2d44;
  color: white;
  cursor: pointer;
  transition: 0.2s;
  font-size: 14px;
}

button:hover {
  background: #3f3f66;
  transform: scale(1.05);
}

/* INPUT STYLE */
input[type="text"] {
  padding: 8px;
  border-radius: 8px;
  border: none;
  outline: none;
  background: #2d2d44;
  color: white;
  min-width: 150px;
}

input[type="color"] {
  width: 40px;
  height: 35px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
}

select {
  padding: 8px;
  border-radius: 8px;
  border: none;
  background: #2d2d44;
  color: white;
  cursor: pointer;
}

/* FILE INPUT */
input[type="file"] {
  color: white;
  font-size: 12px;
}

/* ================= CANVAS AREA ================= */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 70px);
  padding: 10px;
}

/* CANVAS (KERTAS NOTE) */
canvas {
  background: white;
  border-radius: 12px;
  width: 95vw;
  height: 85vh;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);

  /* seperti kertas */
  background-image:
    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 100% 24px;
}

/* ================= MOBILE RESPONSIVE ================= */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: row;
    overflow-x: auto;
    white-space: nowrap;
  }

  button, select, input {
    font-size: 12px;
    padding: 6px;
  }

  canvas {
    width: 98vw;
    height: 80vh;
  }
}

/* ================= SCROLLBAR HIDE ================= */
.toolbar::-webkit-scrollbar {
  display: none;
}
