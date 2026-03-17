import { fb_read, fb_write } from "../FireBase/fb_io.mjs";
let canvas = createCanvas();
let lineColor = (13, 161, 146);
let backgroundColor = (20, 189, 172);

let symbol;
let symbolName;
let nought;
let cross;
let boardArray = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

//fb_initialize();
window.preload = preload;
window.setup = setup;
window.windowResized = windowResized;

let lobbyName;
let lobbyData;
let players;
let lobbyTurn;
let turn;
let uid;

async function preload() {
  console.log("preload");
  nought = loadImage("nought.svg");
  cross = loadImage("cross.svg");
}

async function setup() {
  console.log("setup");
  let lobbyName = sessionStorage.getItem("lobbyName");
  let lobbyData = await fb_read(`/lobbies/${lobbyName}`);
  let players = lobbyData.players;
  let lobbyTurn = lobbyData.turn;
  let turn = false;
  let uid = sessionStorage.getItem("uid");
  if (uid == lobbyTurn) {
    turn = true;
    symbol = cross;
    symbolName = "cross";
  } else {
    symbol = nought;
    symbolName = "nought";
  }
  updateScreen();
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  updateScreen();
}

function updateScreen() {
  background(backgroundColor);

  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;
  let boardSize = min(screenWidth, screenHeight) * 0.1;
  let center = createVector(screenWidth / 2, screenHeight / 2);
  let lineLength = boardSize * 2.7;

  stroke(lineColor);
  strokeWeight(boardSize * 0.2);

  line(
    center.x - lineLength,
    center.y - boardSize,
    center.x + lineLength,
    center.y - boardSize,
  );
  line(
    center.x - lineLength,
    center.y + boardSize,
    center.x + lineLength,
    center.y + boardSize,
  );
  line(
    center.x - boardSize,
    center.y - lineLength,
    center.x - boardSize,
    center.y + lineLength,
  );
  line(
    center.x + boardSize,
    center.y - lineLength,
    center.x + boardSize,
    center.y + lineLength,
  );

  strokeWeight(0);
  refreshSprites(boardSize, center);
}

function refreshSprites(boardSize, center) {
  allSprites.remove();
  let spriteSize = boardSize / 50;
  //row 1
  makeSprite(
    center.x - boardSize * 2,
    center.y - boardSize * 2,
    spriteSize,
    1,
    1,
  );
  makeSprite(center.x, center.y - boardSize * 2, spriteSize, 1, 2);
  makeSprite(
    center.x + boardSize * 2,
    center.y - boardSize * 2,
    spriteSize,
    1,
    3,
  );
  //row 2
  makeSprite(center.x - boardSize * 2, center.y, spriteSize, 2, 1);
  makeSprite(center.x, center.y, spriteSize, 2, 2);
  makeSprite(center.x + boardSize * 2, center.y, spriteSize, 2, 3);
  //row 3
  makeSprite(
    center.x - boardSize * 2,
    center.y + boardSize * 2,
    spriteSize,
    3,
    1,
  );
  makeSprite(center.x, center.y + boardSize * 2, spriteSize, 3, 2);
  makeSprite(
    center.x + boardSize * 2,
    center.y + boardSize * 2,
    spriteSize,
    3,
    3,
  );
}

function makeSprite(x, y, size, row, column) {
  let sprite = new Sprite();
  sprite.color = backgroundColor;
  sprite.scale = size * 1.8;
  sprite.position.x = x;
  sprite.position.y = y;
  sprite.collider = "static";
  sprite.row = row;
  sprite.column = column;
  sprite.update = function () {
    if (this.mouse.presses()) {
      // && turn == true ) {
      console.log("Mouse preessed");
      this.image = symbol;
      this.scale = size;
      print(this.row, this.column);
      boardArray[this.row - 1][this.column - 1] = symbolName;
      makeTurn(this.row, this.column, symbolName);
    }
  };
}

//test if new placement will win
// check row/column of x and y then both diagonals
function checkWin(x, y, _symbol) {
  //check row in boardArray for horizontal win
  if (
    boardArray[x - 1][0] == _symbol &&
    boardArray[x - 1][1] == _symbol &&
    boardArray[x - 1][2] == _symbol
  ) {
    //print("win", x, "row");
  }
  //check column in boardArray for vertical win
  if (
    boardArray[0][y - 1] == _symbol &&
    boardArray[1][y - 1] == _symbol &&
    boardArray[2][y - 1] == _symbol
  ) {
    //print("win", y, "column");
  }
  //since diagonals only happen in 2 cases it is easy to be lazy
  //check diagonal from top-left to bottom-right
  if (
    boardArray[0][0] == _symbol &&
    boardArray[1][1] == _symbol &&
    boardArray[2][2] == _symbol
  ) {
    //print("win", "diagonal");
  }
  //check diagonal from top-right to bottom-left
  if (
    boardArray[0][2] == _symbol &&
    boardArray[1][1] == _symbol &&
    boardArray[2][0] == _symbol
  ) {
    //print("win", "diagonal");
  }
}

async function makeTurn(row, column, symbolName) {
  turn = false;
  await fb_write(boardArray, `/lobbies/${lobbyName}/board`);
  checkWin(row, column, symbolName);
  if (players[0].uid == uid) {
    lobbyTurn = players[1].uid;
  } else {
    lobbyTurn = players[0].uid;
  }
  await fb_write(lobbyTurn, `/lobbies/${lobbyName}/turn`);
}
