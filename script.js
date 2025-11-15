const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const onePlayerBtn = document.getElementById('onePlayerBtn');
const twoPlayerBtn = document.getElementById('twoPlayerBtn');

let gameRunning = false;
let gameMode = null;
let tanks = [];
let bullets = [];

const keys = {};

// tank
class Tank {
  constructor(x, y, color, controls = null, isAI = false) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.color = color;
    this.controls = controls;
    this.isAI = isAI;
    this.size = 25;
    this.speed = 2;
    this.cooldown = 0;
  }

  update() {
    if (this.isAI) {
      this.aiLogic();
    } else {
      this.handleInput();
    }
    if (this.cooldown > 0) this.cooldown--;
  }

  handleInput() {
    if (!this.controls) return;

    if (keys[this.controls.up]) this.move(1);
    if (keys[this.controls.down]) this.move(-1);
    if (keys[this.controls.left]) this.angle -= 0.05;
    if (keys[this.controls.right]) this.angle += 0.05;

    if (keys[this.controls.shoot] && this.cooldown <= 0) {
      this.shoot();
      this.cooldown = 20;
    }
  }

  move(direction) {
    const nextX = this.x + Math.cos(this.angle) * this.speed * direction;
    const nextY = this.y + Math.sin(this.angle) * this.speed * direction;

    let blocked = false;
    for (let wall of walls) {
      if (
        nextX + this.size / 2 > wall.x &&
        nextX - this.size / 2 < wall.x + wall.w &&
        nextY + this.size / 2 > wall.y &&
        nextY - this.size / 2 < wall.y + wall.h
      ) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      this.x = nextX;
      this.y = nextY;
    }

    this.x = Math.max(this.size / 2, Math.min(canvas.width - this.size / 2, this.x));
    this.y = Math.max(this.size / 2, Math.min(canvas.height - this.size / 2, this.y));
  }


  shoot() {
    const offset = this.size / 2 + 5; // start in front of tank
    const bulletX = this.x + Math.cos(this.angle) * offset;
    const bulletY = this.y + Math.sin(this.angle) * offset;

for (let wall of walls) {
  if (
    bulletX > wall.x &&
    bulletX < wall.x + wall.w &&
    bulletY > wall.y &&
    bulletY < wall.y + wall.h
  ) {
    return; 
  }
}

bullets.push(new Bullet(bulletX, bulletY, this.angle, this.id));

  }

  aiLogic() {
    const player = tanks[0];
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const targetAngle = Math.atan2(dy, dx);
 
    let diff = targetAngle - this.angle;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    this.angle += diff * 0.05;

    if (Math.random() < 0.98) this.move(1);

    if (Math.abs(diff) < 0.2 && this.cooldown <= 0) {
      this.shoot();
      this.cooldown = 50;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.fillStyle = 'black';
    ctx.fillRect(this.size / 2, -4, 15, 8);
    ctx.restore();
  }
}

class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * 6;
    this.vy = Math.sin(angle) * 6;
    this.life = 500;
    this.radius = 5;
  }

  update() {
  const nextX = this.x + this.vx;
  const nextY = this.y + this.vy;

  let hitWall = false;
  for (let wall of walls) {
    if (
      nextX - this.radius < wall.x + wall.w &&
      nextX + this.radius > wall.x &&
      nextY - this.radius < wall.y + wall.h &&
      nextY + this.radius > wall.y
    ) {
      hitWall = true;
      
      const centerX = wall.x + wall.w / 2;
      const centerY = wall.y + wall.h / 2;
      
      const distToLeftRight = Math.min(
        Math.abs(nextX - wall.x), 
        Math.abs(nextX - (wall.x + wall.w))
      );
      const distToTopBottom = Math.min(
        Math.abs(nextY - wall.y), 
        Math.abs(nextY - (wall.y + wall.h))
      );
      
      if (distToLeftRight < distToTopBottom) {
        this.vx *= -1; 
      } else {
        this.vy *= -1; 
      }
      
      break;
    }
  }

  if (!hitWall) {
    this.x = nextX;
    this.y = nextY;
  }

  if (this.x <= this.radius || this.x >= canvas.width - this.radius) {
    this.vx *= -1;
    this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
  }
  if (this.y <= this.radius || this.y >= canvas.height - this.radius) {
    this.vy *= -1;
    this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
  }

  this.life--;
}


  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

// idk 
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// loop
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  tanks.forEach(t => t.update());
  bullets.forEach(b => b.update());

  tanks.forEach(t => t.draw());
  bullets.forEach(b => b.draw());

  bullets = bullets.filter(b => b.life > 0);

walls.forEach(w => w.draw());


for (let i = bullets.length - 1; i >= 0; i--) {
  const b = bullets[i];
  for (let j = 0; j < tanks.length; j++) {
    const t = tanks[j];
    const dx = b.x - t.x;
    const dy = b.y - t.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < t.size / 2 + b.radius) { 
      bullets.splice(i, 1);
      tanks.splice(j, 1);
      console.log('💥 Tank destroyed!');
      break;
    }
  }
}

  requestAnimationFrame(gameLoop);
}


function startGame(mode) {
  gameMode = mode;
  gameRunning = true;
  menu.style.display = 'none';
  canvas.style.display = 'block';

  tanks = [];
  bullets = [];

  const player1Controls = {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    shoot: 'Space'
  };

  const player2Controls = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    shoot: 'Enter'
  };

  if (mode === '1P') {
    tanks.push(new Tank(200, 300, 'lime', player1Controls)); 
    tanks.push(new Tank(700, 300, 'red', null, true));      
  } else if (mode === '2P') {
    tanks.push(new Tank(200, 300, 'lime', player1Controls));
    tanks.push(new Tank(700, 300, 'red', player2Controls));
  }

  gameLoop();
}

onePlayerBtn.addEventListener('click', () => startGame('1P'));
twoPlayerBtn.addEventListener('click', () => startGame('2P'));

// the map
class Wall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  draw() {
    ctx.fillStyle = '#555';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

let walls = [
  new Wall(100, 100, 200, 20),
  new Wall(400, 80, 20, 150),
  new Wall(600, 200, 150, 20),

  new Wall(500, 400, 20, 200),

  new Wall(100, 450, 200, 20),
  new Wall(350, 500, 200, 20),
  new Wall(650, 500, 150, 20),
  new Wall(800, 300, 20, 150)
];