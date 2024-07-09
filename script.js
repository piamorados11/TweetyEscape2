// Define constants and variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const button = document.querySelector('button');
const gameMusic = document.getElementById('gameMusic');
const buttonSound = document.getElementById('buttonSound');
const flapSound = document.getElementById('flapSound');
const deadSound = document.getElementById('deadSound');
const pointSound = document.getElementById('pointSound');

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.9;

// Load images
const twittyImg = new Image();
twittyImg.src = 'https://i.postimg.cc/Vv3pYHNq/character.png';

const pipeImgTop = new Image();
pipeImgTop.src = 'https://i.postimg.cc/QC67QsfV/tree.png';

const pipeImgBottom = new Image();
pipeImgBottom.src = 'https://i.postimg.cc/QC67QsfV/tree.png';

const instructionImg = new Image();
instructionImg.src = 'https://i.postimg.cc/KzqS5sd9/instruction.png';

const logoImg = new Image();
logoImg.src = 'https://i.postimg.cc/Vv3pYHNq/character.png';

let pipes = [];
let score = 0;
let attempts = 0;
let bestScore = 0;
let gameOver = false;
let gameStarted = false;
let showingMenu = true;
let showingHowToPlay = false;
let newBest = false;
let showMessage = false;
let blink = true;

const difficulty = {
  beginner: { gap: 150, interval: 2000, speed: 2 },
  medium: { gap: 130, interval: 1500, speed: 4 },
  hard: { gap: 100, interval: 1000, speed: 6 }
};

let currentDifficulty = difficulty.beginner;

const twitty = {
  x: 350,
  y: -50,
  width: 40,
  height: 40,
  gravity: 0.5,
  lift: -8,
  velocity: 0,
  rotation: 0,
  show() {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);
    ctx.drawImage(twittyImg, -this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  },
  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;
    if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
      this.velocity = 0;
      gameOver = true;
      deadSound.play(); // Play dead sound on hitting ground
    }
    if (this.y < 0) {
      this.y = 0;
      this.velocity = 0;
      gameOver = true;
      deadSound.play(); // Play dead sound on hitting top
    }
    this.rotation = this.velocity < 0 ? -0.2 : 0.2;
  },
  up() {
    this.velocity = this.lift;
    this.rotation = 0;
  }
};

function Pipe() {
  this.gap = currentDifficulty.gap;
  this.top = Math.random() * (canvas.height / 2 - this.gap);
  this.bottom = canvas.height - (this.top + this.gap);
  this.x = canvas.width;
  this.width = 80;
  this.speed = currentDifficulty.speed;

  this.show = function() {
    ctx.drawImage(pipeImgTop, this.x, 0, this.width, this.top);
    ctx.drawImage(pipeImgBottom, this.x, canvas.height - this.bottom, this.width, this.bottom);
  };

  this.update = function() {
    this.x -= this.speed;
  };

  this.offscreen = function() {
    return this.x < -this.width;
  };

  this.hits = function(twitty) {
    // Ensure twitty's boundaries are checked correctly against pipes
    if (
      twitty.x + twitty.width > this.x &&
      twitty.x < this.x + this.width &&
      (twitty.y < this.top || twitty.y + twitty.height > canvas.height - this.bottom)
    ) {
      return true;
    }
    return false;
  };

  this.passed = function(twitty) {
    return twitty.x > this.x + this.width && !this.scored;
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (showingMenu) {
    drawMenu();
  } else if (showingHowToPlay) {
    drawHowToPlay();
  } else if (!gameStarted) {
    drawStartScreen();
  } else {
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].show();
      pipes[i].update();

      if (pipes[i].hits(twitty)) {
        gameOver = true;
        deadSound.play();
      }

      if (pipes[i].passed(twitty)) {
        pipes[i].scored = true;
        score++;
        pointSound.play();
        adjustDifficulty();
      }

      if (pipes[i].offscreen()) {
        pipes.splice(i, 1);
      }
    }

    twitty.show();
    twitty.update();

    drawScore();
    drawAttempts();
    drawBestScore();
    drawNewBest();

    if (score > bestScore && attempts > 1 && !newBest) {
      newBest = true;
      setTimeout(() => {
        newBest = false;
      }, 1000); // New best message will display for 1 second
    }

    if (gameOver) {
      drawGameOver();
    } else {
      requestAnimationFrame(draw);
    }
  }
}

function drawMenu() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add big logo image above the "Twitty Escape" text
  ctx.drawImage(logoImg, canvas.width / 3 - 170, canvas.height / 2 - 275, 400, 400);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 68px "Lucida Handwriting", cursive';
  ctx.fillText('Tweety Escape', canvas.width / 2.8 - 250, canvas.height / 1.1 - 40);

  // Move buttons to the right
  ctx.fillStyle = 'yellow';
  ctx.fillRect(canvas.width / 2 + 150, canvas.height / 2 - 20, 250, 50);
  ctx.fillRect(canvas.width / 2 + 150, canvas.height / 2 + 40, 250, 50);
  
  ctx.fillStyle = 'black';
  ctx.font = 'bold 34px "Pixelify Sans"';
  ctx.fillText('START', canvas.width / 2 + 216, canvas.height / 1.95 + 10);
  ctx.fillText('Instruction', canvas.width / 2 + 192, canvas.height / 1.95 + 70);
}

function drawStartScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '36px Arial bold';
  ctx.fillText('Press SPACE to START the game!!', canvas.width / 2 - 250, canvas.height / 2);

  // Display additional message when game starts
  if (showMessage) {
    ctx.fillStyle = 'yellow';
    ctx.font = '36px Arial bold';
    ctx.fillText('DON\'T LET TWEETY FALL', canvas.width / 2 - 200, canvas.height / 2 + 100);
  }
}

function drawHowToPlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the instruction image
  ctx.drawImage(instructionImg, canvas.width / 2 - 230, canvas.height / 2 - 240, 450, 450);
  
  // Draw Back button
  ctx.fillStyle = 'yellow';
  ctx.fillRect(canvas.width / 1.25 - 100, canvas.height / 1.5 + 60, 100, 50);
  ctx.fillStyle = 'black';
  ctx.font = 'bold 34px "Pixelify Sans"';
  ctx.fillText('Back', canvas.width / 1.234 - 100, canvas.height / 1.40 + 70, 100, 50);
}

function drawScore() {
  ctx.fillStyle = 'aquamarine';
  ctx.font = '80px Arial bold';
  ctx.fillText(score, canvas.width / 2.15, 100, 300);
}

function drawAttempts() {
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial bold';
  ctx.fillText('Attempts: ' + attempts, 15, 35);
}

function drawBestScore() {
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial bold';
  ctx.fillText('Best: ' + bestScore, 15, 70);
}

function drawNewBest() {
  if (newBest) {
    ctx.fillStyle = 'red';
    ctx.font = '48px Arial bold';
    ctx.fillText('NEW BEST', canvas.width / 2 - 150, 100);
  }
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw "GAME OVER" text
  ctx.fillStyle = 'red';
  ctx.font = 'bold 160px "Pixelify Sans"';
  ctx.fillText('GAME OVER', canvas.width / 2 - 500, canvas.height / 2 - 90);

  // Draw score text
  if (score > bestScore) {
    ctx.fillStyle = 'yellow';
    ctx.font = '48px Arial bold';
    ctx.fillText('NEW BEST: ' + score, canvas.width / 2 - 150, 300);
  } else {
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial bold';
    ctx.fillText('Score: ' + score, canvas.width / 2 - 90, 300);
  }

  // Draw button backgrounds
  ctx.fillStyle = 'yellow';
  ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 + 80, 300, 50);
  ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 + 140, 300, 50);

  // Draw button texts
  ctx.fillStyle = 'black';
  ctx.font = 'bold 34px "Pixelify Sans"';
  ctx.fillText('Play Again', canvas.width / 2 - 75, canvas.height / 2 + 115);
  ctx.fillText('Main Menu', canvas.width / 2 - 86, canvas.height / 2 + 175);
}

function adjustDifficulty() {
  if (score > 20) {
    currentDifficulty = difficulty.hard;
  } else if (score > 10) {
    currentDifficulty = difficulty.medium;
  } else {
    currentDifficulty = difficulty.beginner;
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameOver) {
      buttonSound.play();
      resetGame();
    } else if (!showingMenu && !showingHowToPlay) {
      if (!gameStarted) {
        gameStarted = true;
        gameMusic.play(); // Play the background music when the game starts
        draw();
      } else {
        flapSound.play();
        twitty.up();
      }
    }
  }
});

document.addEventListener('click', function(event) {
  const x = event.clientX - canvas.offsetLeft;
  const y = event.clientY - canvas.offsetTop;
  
  if (showingMenu) {
    if (x >= canvas.width / 2 + 150 && x <= canvas.width / 2 + 400) {
      if (y >= canvas.height / 2 - 20 && y <= canvas.height / 2 + 30) {
        buttonSound.play();
        startGame();
      } else if (y >= canvas.height / 2 + 40 && y <= canvas.height / 2 + 90) {
        buttonSound.play();
        showHowToPlay();
      }
    }
  } else if (showingHowToPlay) {
    if (x >= canvas.width / 1.25 - 100 && x <= canvas.width / 1.25 && y >= canvas.height / 1.5 + 60 && y <= canvas.height / 1.5 + 110) {
      buttonSound.play();
      showingHowToPlay = false;
      showingMenu = true;
      draw();
    }
  } else if (gameOver) {
    if (x >= canvas.width / 2 - 150 && x <= canvas.width / 2 + 150) {
      if (y >= canvas.height / 2 + 80 && y <= canvas.height / 2 + 130) {
        buttonSound.play();
        resetGame();
      } else if (y >= canvas.height / 2 + 140 && y <= canvas.height / 2 + 190) {
        buttonSound.play();
        showMainMenu();
      }
    }
  }
});

function generatePipes() {
  if (pipes.length > 0) {
    const lastPipe = pipes[pipes.length - 1];
    const gap = currentDifficulty.gap;
    const speed = currentDifficulty.speed;

    // Ensure at least 100px gap between pipes
    if (canvas.width - lastPipe.x > gap + 100) {
      pipes.push(new Pipe());
    }
  } else {
    pipes.push(new Pipe());
  }

  if (!gameOver) {
    setTimeout(generatePipes, currentDifficulty.interval);
  }
}

function startGame() {
  showingMenu = false;
  showingHowToPlay = false;
  gameStarted = false;
  gameOver = false;
  newBest = false;
  score = 0;
  attempts++;
  twitty.y = canvas.height / 2;
  twitty.velocity = 0; // Reset velocity
  pipes = []; // Clear existing pipes
  generatePipes();
  drawStartScreen();
}

function showMainMenu() {
  showingMenu = true;
  showingHowToPlay = false;
  gameStarted = false;
  gameOver = false;
  score = 0;
  pipes = [];
  draw();
}

function showHowToPlay() {
  showingMenu = false;
  showingHowToPlay = true;
  draw();
}

function resetGame() {
  if (score > bestScore) {
    bestScore = score; // Update the best score
    newBest = false;
  } 
  score = 0;
  pipes = [];
  gameOver = false;
  gameStarted = false;
  twitty.y = canvas.height / 2;
  twitty.velocity = 0; // Reset velocity
  attempts++;
  generatePipes();
  draw();
}

// Initial draw call to show the menu
draw();
