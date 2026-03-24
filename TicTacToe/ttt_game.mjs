import { fb_read, fb_write, fb_onValue } from "../FireBase/fb_io.mjs";
let canvas = createCanvas();
let lineColor = (13, 161, 146);
let backgroundColor = (20, 189, 172);

let symbol;
let symbolName;
let nought;
let cross;
let boardArray = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
];
let boardSize;
let center;
let canMove;

let uid;
let lobbyName;
let lobbyData;
let players;
let lobbyTurn;
let turn;
let turnText;
let symbolText;

//fb_initialize();
window.preload = preload;
window.setup = setup;
window.windowResized = windowResized;

function preload() {
    console.log("preload");
    nought = loadImage("nought.svg");
    cross = loadImage("cross.svg");
}

async function setup() {
    console.log("setup");
    lobbyName = sessionStorage.getItem("lobbyName");
    lobbyData = await fb_read(`/lobbies/${lobbyName}`);
    players = lobbyData.players;
    lobbyTurn = lobbyData.turn;
    turn = false;
    uid = sessionStorage.getItem("uid");
    while (lobbyTurn == undefined) {
        lobbyTurn = await fb_read(`/lobbies/${lobbyName}/turn`);
    }
    console.log(`My uid:${uid}, Turn:${lobbyTurn}`);
    if (uid == lobbyTurn) {
        turn = true;
        symbol = cross;
        symbolName = "cross";
    } else {
        symbol = nought;
        symbolName = "nought";
        waitForTurn();
    }
    updateScreen();
    console.log(document.getElementById("endScreenDiv").children);
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    updateScreen();
}

function updateScreen() {
    background(backgroundColor);
    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;
    boardSize = min(screenWidth, screenHeight) * 0.1;
    center = createVector(screenWidth / 2, screenHeight / 2);
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
    refreshSprites();
    textSize(30);
    fill(lineColor);
    turnText = text(`Turn: ${turn}`, 50, 50);
    symbolText = text(`Your Symbol: ${symbolName}`, 50, 100);
}

function refreshSprites() {
    allSprites.remove();
    canMove = false;
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
        if (this.mouse.presses() && turn == true && this.image == null) {
            this.image = symbol;
            this.scale = size;
            boardArray[this.row - 1][this.column - 1] = symbolName;
            makeTurn(this.row, this.column, symbolName);
        }
    };
    if (boardArray[row - 1][column - 1] != 0) {
        if (boardArray[row - 1][column - 1] == "nought") {
            sprite.image = nought;
            sprite.scale = size;
        } else {
            sprite.image = cross;
            sprite.scale = size;
        }
    } else {
        canMove = true;
    }
}

//test if new placement will win
// check row/column of x and y then both diagonals
async function checkWin(x, y, _symbol) {
    //check row in boardArray for horizontal win
    if (
        boardArray[x - 1][0] == _symbol &&
        boardArray[x - 1][1] == _symbol &&
        boardArray[x - 1][2] == _symbol
    ) {
        winningMove();
    }
    //check column in boardArray for vertical win
    if (
        boardArray[0][y - 1] == _symbol &&
        boardArray[1][y - 1] == _symbol &&
        boardArray[2][y - 1] == _symbol
    ) {
        winningMove();
    }
    //since diagonals only happen in 2 cases it is easy to be lazy
    //check diagonal from top-left to bottom-right
    if (
        boardArray[0][0] == _symbol &&
        boardArray[1][1] == _symbol &&
        boardArray[2][2] == _symbol
    ) {
        winningMove();
    }
    //check diagonal from top-right to bottom-left
    if (
        boardArray[0][2] == _symbol &&
        boardArray[1][1] == _symbol &&
        boardArray[2][0] == _symbol
    ) {
        winningMove();
    }
}

async function makeTurn(row, column, symbolName) {
    turn = false;
    textSize(30);
    fill(lineColor);
    await fb_write(boardArray, `/lobbies/${lobbyName}/board`);
    checkWin(row, column, symbolName);
    players[0].uid == uid
        ? (lobbyTurn = players[1].uid)
        : (lobbyTurn = players[0].uid);
    await fb_write(lobbyTurn, `/lobbies/${lobbyName}/turn`);
    turn = false;
    updateScreen();
    waitForTurn();
}

async function waitForTurn() {
    console.log("wait for turn");
    const PATH = `/lobbies/${lobbyName}/turn`;
    await fb_onValue(PATH);
    boardArray = await fb_read(`/lobbies/${lobbyName}/board`);
    turn = true;
    updateScreen();
    let winCheck = await fb_read(`/lobbies/${lobbyName}/winner`);
    if (winCheck != undefined) {
        console.log(`${winCheck} wins`);
        endGame();
    }
}

async function winningMove() {
    console.log("win");
    let userName = await fb_read(
        `/userDetails/${sessionStorage.getItem("uid")}/username`,
    );
    let winInfo = { symbol: symbolName, userName: userName };
    await fb_write(winInfo, `/lobbies/${lobbyName}/winner`);
    endGame();
}

async function endGame() {
    document.getElementById("endScreenDiv").style.visibility = "visible";
    let winInfo = await fb_read(`/lobbies/${lobbyName}/winner`);
    let plural;
    winInfo.symbol == "cross" ? (plural = "es") : (plural = "s");
    document.getElementById("endScreenDiv").children[0].innerHTML =
        `${winInfo.userName} (${winInfo.symbol}${plural}) wins!`;
}
