const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");

let gameState = "menu"; // menu | running | gameover
let score = 0;
let lost = 0;
let speed = 4;
let multiplier = 1;
let tick = 0;

// Load player character image
const playerImage = new Image();
playerImage.src = "img/player.png";

function bindStartButton() {
  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", resetGame);
  }
}

const player = {
  x: 70,
  y: canvas.height - 120,
  w: 50,
  h: 70,
  vy: 0,
  gravity: 0.8,
  jumpPower: -15,
  onGround: false,
};

const keys = { ArrowLeft:false, ArrowRight:false, ArrowUp:false };

let obstacles = [];
let items = [];

function resetGame() {
  score = 0;
  lost = 0;
  speed = 4;
  multiplier = 1;
  tick = 0;
  player.x = 70;
  player.y = canvas.height - player.h - 30;
  player.vy = 0;
  player.onGround = true;
  obstacles = [];
  items = [];
  gameState = "running";
  overlay.classList.add("hide");
}

window.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "ArrowUp") {
    e.preventDefault();
  }
  if (["ArrowLeft","ArrowRight","ArrowUp"].includes(e.key)) {
    keys[e.key] = true;
  }
  if (e.key === "r" && gameState === "gameover") {
    resetGame();
  }
});
window.addEventListener("keyup", (e) => {
  if (["ArrowLeft","ArrowRight","ArrowUp"].includes(e.key)) {
    keys[e.key] = false;
  }
});

function spawnEntity() {
  if (tick % 85 === 0) {
    const obstacle = {
      x: canvas.width + 20,
      y: canvas.height - 40 - 30,
      w: 45,
      h: 40,
      type: "rival",
      color: "#ffffff",
      value: -1,
    };
    obstacles.push(obstacle);
  }

  if (tick % 140 === 0) {
    const item = {
      x: canvas.width + 20,
      y: canvas.height - 120 - Math.floor(Math.random() * 120),
      w: 30,
      h: 30,
      type: "scarf",
      color: "#ffde00",
      value: 10,
    };
    items.push(item);
  }

  if (tick % 400 === 0) {
    const badge = {
      x: canvas.width + 20,
      y: canvas.height - 180,
      w: 34,
      h: 34,
      type: "badge",
      color: "#d70016",
      value: 35,
    };
    items.push(badge);
  }
}

function updatePlayer() {
  if (keys.ArrowLeft) player.x -= 5;
  if (keys.ArrowRight) player.x += 5;
  if (keys.ArrowUp && player.onGround) {
    player.vy = player.jumpPower;
    player.onGround = false;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
  player.vy += player.gravity;
  player.y += player.vy;

  const groundY = canvas.height - player.h - 30;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }
}

function collision(a,b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateEntities() {
  obstacles.forEach((obs) => {
    obs.x -= speed;
    if (collision(player, obs)) {
      lost += 1;
      obs.hit = true;
    }
  });
  items.forEach((it) => {
    it.x -= speed;
    if (collision(player, it)) {
      score += it.value;
      it.collected = true;
    }
  });

  obstacles = obstacles.filter((o) => !o.hit && o.x + o.w > 0);
  items = items.filter((i) => !i.collected && i.x + i.w > 0);
}

function updateScoring() {
  score += 0.01 * multiplier;
  if (tick % 600 === 0) {
    speed += 0.30;
    multiplier += 0.05;
  }
  if (lost >= 3) {
    gameState = "gameover";
    overlay.classList.remove("hide");
    overlay.innerHTML = `
      <h1>Game Over</h1>
      <p>Final Score: ${Math.floor(score)}</p>
      <p>New Baws drums or restart with R</p>
      <button id="startBtn">PLAY AGAIN</button>
    `;
    bindStartButton();
  }
}

function drawBackground() {
  const g = ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0, "#08131a");
  g.addColorStop(1, "#0f2332");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0b1320";
  ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
  ctx.fillStyle = "#0f2a40";
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.fillRect(i + ((tick * 0.3) % 40), canvas.height - 40, 15, 10);
  }
}

function drawText() {
  ctx.fillStyle = "#fff";
  ctx.font = "20px Segoe UI";
  ctx.fillText(`Score: ${Math.floor(score)}`, 18, 30);
  ctx.fillText(`Lost: ${lost}/3`, 18, 58);
  ctx.fillText(`Speed: ${speed.toFixed(1)}`, 18, 86);

  ctx.fillStyle = "#d70016";
  ctx.font = "bold 24px Segoe UI";
  ctx.fillText("GOONER MODE", canvas.width - 190, 30);
}

function draw() {
  drawBackground();
  
  // Draw player image if loaded, otherwise fallback to colored rectangles
  if (playerImage.complete && playerImage.naturalHeight !== 0) {
    ctx.drawImage(playerImage, player.x, player.y, player.w, player.h);
  } else {
    // Fallback: draw colored rectangles
    ctx.fillStyle = "#d70016";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = "#ffde00";
    ctx.fillRect(player.x + 10, player.y + 10, 30, 14);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(player.x + 10, player.y + 28, 30, 8);
  }

  obstacles.forEach((o) => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
  items.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(item.x, item.y, item.w, item.h);
  });

  drawText();
}

function gameLoop() {
  if (gameState === "running") {
    tick++;
    spawnEntity();
    updatePlayer();
    updateEntities();
    updateScoring();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

overlay.innerHTML = `
  <h1>Gooner Runner</h1>
  <p>Collect scarves + badges, avoid rivals</p>
  <p>Use Arrow keys, R to restart after fail</p>
  <button id="startBtn">START GAME</button>
`;
bindStartButton();
gameLoop();