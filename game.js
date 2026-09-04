const CELL = 20;
const COLS = 20;
const ROWS = 20;
const CANVAS_W = CELL * COLS;
const CANVAS_H = CELL * ROWS;
const BASE_SPEED = 140;

const canvas = document.getElementById('game-canvas');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const finalScoreEl = document.getElementById('final-score');
const overlayStart = document.getElementById('overlay-start');
const overlayOver = document.getElementById('overlay-over');
const overlayPause = document.getElementById('overlay-pause');

let snake, dir, nextDir, food, score, bestScore, running, paused, lastTick, speed;

bestScore = parseInt(localStorage.getItem('snake-best') || '0', 10);
bestScoreEl.textContent = bestScore;

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  speed = BASE_SPEED;
  scoreEl.textContent = 0;
  placeFood();
}

function placeFood() {
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    valid = !snake.some((s) => s.x === food.x && s.y === food.y);
  }
}

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0) head.x = COLS - 1;
  else if (head.x >= COLS) head.x = 0;
  if (head.y < 0) head.y = ROWS - 1;
  else if (head.y >= ROWS) head.y = 0;

  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      bestScoreEl.textContent = bestScore;
      localStorage.setItem('snake-best', String(bestScore));
    }
    if (score % 5 === 0 && speed > 60) speed -= 8;
    placeFood();
  } else {
    snake.pop();
  }
}

function draw() {
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, CANVAS_H);
    ctx.stroke();
  }
  for (let i = 1; i < ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(CANVAS_W, i * CELL);
    ctx.stroke();
  }

  const fx = food.x * CELL + CELL / 2;
  const fy = food.y * CELL + CELL / 2;
  const pulse = Math.sin(Date.now() / 200) * 2;
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(fx, fy, CELL / 2 - 3 + pulse * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  for (let i = snake.length - 1; i >= 0; i--) {
    const s = snake[i];
    const t = 1 - i / snake.length;
    const g = Math.round(160 + 95 * t);
    if (i === 0) {
      ctx.shadowColor = '#00e5a0';
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = i === 0 ? '#00ffb0' : 'rgb(0, ' + g + ', ' + Math.round(100 + 60 * t) + ')';
    roundRect(ctx, s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 5);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  if (snake[0]) {
    const h = snake[0];
    ctx.fillStyle = '#0a0e1a';
    const ex = h.x * CELL + CELL / 2;
    const ey = h.y * CELL + CELL / 2;
    const off = 4;
    if (dir.x === 1) {
      ctx.beginPath(); ctx.arc(ex + off, ey - 3, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + off, ey + 3, 2, 0, Math.PI * 2); ctx.fill();
    } else if (dir.x === -1) {
      ctx.beginPath(); ctx.arc(ex - off, ey - 3, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex - off, ey + 3, 2, 0, Math.PI * 2); ctx.fill();
    } else if (dir.y === -1) {
      ctx.beginPath(); ctx.arc(ex - 3, ey - off, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + 3, ey - off, 2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(ex - 3, ey + off, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + 3, ey + off, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function gameOver() {
  running = false;
  finalScoreEl.textContent = score;
  overlayOver.classList.remove('hidden');
}

function loop(ts) {
  if (!running) { draw(); return; }
  if (paused) { lastTick = ts; requestAnimationFrame(loop); return; }
  if (!lastTick) lastTick = ts;
  if (ts - lastTick >= speed) {
    lastTick = ts;
    tick();
  }
  draw();
  requestAnimationFrame(loop);
}

function startGame() {
  reset();
  running = true;
  paused = false;
  lastTick = 0;
  overlayStart.classList.add('hidden');
  overlayOver.classList.add('hidden');
  overlayPause.classList.add('hidden');
  requestAnimationFrame(loop);
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) overlayPause.classList.remove('hidden');
  else overlayPause.classList.add('hidden');
}

function setDir(d) {
  const map = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const nd = map[d];
  if (!nd) return;
  if (nd.x === -dir.x && nd.y === -dir.y) return;
  nextDir = nd;
}

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
document.getElementById('btn-resume').addEventListener('click', togglePause);

document.addEventListener('keydown', function (e) {
  const k = e.key;
  if (k === 'ArrowUp') { e.preventDefault(); setDir('up'); }
  else if (k === 'ArrowDown') { e.preventDefault(); setDir('down'); }
  else if (k === 'ArrowLeft') { e.preventDefault(); setDir('left'); }
  else if (k === 'ArrowRight') { e.preventDefault(); setDir('right'); }
  else if (k === ' ') { e.preventDefault(); togglePause(); }
  else if (k === 'Enter' && !running) { startGame(); }
});

document.querySelectorAll('.dpad-btn').forEach(function (b) {
  const handler = function (e) { e.preventDefault(); setDir(b.dataset.dir); };
  b.addEventListener('touchstart', handler, { passive: false });
  b.addEventListener('click', handler);
});

let touchStart = null;
canvas.addEventListener('touchstart', function (e) {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

canvas.addEventListener('touchend', function (e) {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    setDir(dx > 0 ? 'right' : 'left');
  } else {
    setDir(dy > 0 ? 'down' : 'up');
  }
  touchStart = null;
}, { passive: true });

reset();
draw();
