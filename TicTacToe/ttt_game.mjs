import { fb_read, fb_write, fb_onValue } from "../FireBase/fb_io.mjs";
import { startLobbyScreen } from "./ttt_lobby.mjs";

let lineColor = (13, 161, 146);
let backgroundColor = (20, 189, 172);

//screen cords
let center;
let boardSize;
const LAYOUT = {
    boardScale: 0.1,
    lineLengthScale: 2.7,
    lineWidthScale: 0.2,
    spriteScale: 0.036,
    imageScale: 0.02
}

//assets
let noughtImage;
let crossImage;

//lobby info
let boardArray;
let canMove;
let players;
let lobbyName;

//player info
let uid;
let symbolImage;
let symbolName;
let turn;

window.preload = preload;
window.setup = setup;
window.windowResized = windowResized;

function preload() {
    noughtImage = loadImage("nought.svg");
    crossImage = loadImage("cross.svg");
}

async function setup() {
    while (document.getElementsByClassName("q5Canvas") == null) { await new Promise((resolve) => setTimeout(resolve, 100)); }
    document.getElementsByClassName("q5Canvas")[0].style.visibility = "hidden";
}

export async function ttt_startGame() {
    console.log("start game");
    //console.log(document.getElementsByClassName("q5Canvas"));
    resizeCanvas(window.innerWidth, window.innerHeight);
    lobbyName = sessionStorage.getItem("lobbyName");
    let lobbyData = await fb_read(`/lobbies/${lobbyName}`);
    players = lobbyData.players;
    uid = sessionStorage.getItem("uid");
    boardArray = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];

    let lobbyTurn;
    while (lobbyTurn == undefined) {
        lobbyTurn = await fb_read(`/lobbies/${lobbyName}/turn`);
    }
    //console.log(`My uid:${uid}, Turn:${lobbyTurn}`);
    if (uid == lobbyTurn) {
        turn = true;
        symbolImage = crossImage;
        symbolName = "cross";
    } else {
        turn = false;
        symbolImage = noughtImage;
        symbolName = "nought";
        waitForTurn();
    }

    updateScreen();
    document.getElementsByClassName("q5Canvas")[0].style.visibility = "visible";
}

function windowResized() {
    if (document.getElementsByClassName("q5Canvas")[0].style.visibility == "hidden") { return; }
    resizeCanvas(window.innerWidth, window.innerHeight);
    updateScreen();
}

function updateScreen() {
    //console.log("updateScreen");

    //resize
    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;
    boardSize = min(screenWidth, screenHeight) * LAYOUT.boardScale;
    center = createVector(screenWidth / 2, screenHeight / 2);
    
    //redraw
    background(backgroundColor);
    drawLines()
    strokeWeight(0);
    refreshSprites();
    textSize(30);
    fill(lineColor);
    text(`Turn: ${turn}`, 50, 50);
    text(`Your Symbol: ${symbolName}`, 50, 100);
}

function drawLines(){
    let lineLength = boardSize * LAYOUT.lineLengthScale;
    let lineWidth = boardSize * LAYOUT.lineWidthScale;
    stroke(lineColor);
    strokeWeight(lineWidth);
    line(center.x - lineLength, center.y - boardSize, center.x + lineLength, center.y - boardSize);
    line(center.x - lineLength, center.y + boardSize, center.x + lineLength, center.y + boardSize);
    line(center.x - boardSize, center.y - lineLength, center.x - boardSize, center.y + lineLength);
    line(center.x + boardSize, center.y - lineLength, center.x + boardSize, center.y + lineLength);
}

function refreshSprites() {
    allSprites.remove();
    canMove = false;
    //row 1
    makeSprite(center.x - boardSize * 2, center.y - boardSize * 2, boardSize, 1, 1,);
    makeSprite(center.x, center.y - boardSize * 2, boardSize, 1, 2);
    makeSprite(center.x + boardSize * 2, center.y - boardSize * 2, boardSize, 1, 3,);
    //row 2
    makeSprite(center.x - boardSize * 2, center.y, boardSize, 2, 1);
    makeSprite(center.x, center.y, boardSize, 2, 2);
    makeSprite(center.x + boardSize * 2, center.y, boardSize, 2, 3);
    //row 3
    makeSprite(center.x - boardSize * 2, center.y + boardSize * 2, boardSize, 3, 1,);
    makeSprite(center.x, center.y + boardSize * 2, boardSize, 3, 2);
    makeSprite(center.x + boardSize * 2, center.y + boardSize * 2, boardSize, 3, 3,);
    if (!canMove) {
        endGame("draw");
    }
}

function makeSprite(x, y, size, row, column) {
    let sprite = new Sprite();
    Object.assign(sprite, {
        color: backgroundColor,
        scale: size*LAYOUT.spriteScale,
        collider: "static",
        row: row,
        column: column
    })
    sprite.position = {x,y};
    sprite.update = function () {
        if (this.mouse.presses() && turn == true && this.image == null) {
            this.image = symbolImage;
            this.scale = size*LAYOUT.imageScale;
            boardArray[this.row - 1][this.column - 1] = symbolName;
            makeTurn(this.row, this.column, symbolName);
        }
    };
    if (boardArray[row - 1][column - 1] != 0) {
        boardArray[row - 1][column - 1] == "nought" ? sprite.image = noughtImage : sprite.image = crossImage;
        sprite.scale = size*LAYOUT.imageScale;
    } else {
        canMove = true;
    }
}

//test if new placement will win
async function checkWin(x, y, symbol) {
    //check row in boardArray for horizontal win
    if (boardArray[x - 1][0] == symbol && boardArray[x - 1][1] == symbol && boardArray[x - 1][2] == symbol) {
        winningMove();
    }
    //check column in boardArray for vertical win
    if (boardArray[0][y - 1] == symbol && boardArray[1][y - 1] == symbol && boardArray[2][y - 1] == symbol) {
        winningMove();
    }
    //since diagonals only happen in 2 cases check manually
    //check diagonal from top-left to bottom-right
    if (boardArray[0][0] == symbol && boardArray[1][1] == symbol && boardArray[2][2] == symbol) {
        winningMove();
    }
    //check diagonal from top-right to bottom-left
    if (boardArray[0][2] == symbol && boardArray[1][1] == symbol && boardArray[2][0] == symbol) {
        winningMove();
    }
}

async function makeTurn(row, column, symbolName) {
    turn = false;
    textSize(30);
    fill(lineColor);
    await fb_write(boardArray, `/lobbies/${lobbyName}/board`);
    checkWin(row, column, symbolName);
    let lobbyTurn = players[0].uid == uid ? players[1].uid : players[0].uid;
    await fb_write(lobbyTurn, `/lobbies/${lobbyName}/turn`);
    updateScreen();
    waitForTurn();
}

async function waitForTurn() {
    //console.log("wait for turn");
    await fb_onValue(`/lobbies/${lobbyName}/turn`);
    //begin turn
    boardArray = await fb_read(`/lobbies/${lobbyName}/board`);
    turn = true;
    updateScreen();
    let winCheck = await fb_read(`/lobbies/${lobbyName}/winner`);
    if (winCheck != undefined) {
        console.log(`${winCheck} wins`);
        endGame("win");
    }
}

async function winningMove() {
    let userName = await fb_read(`/userDetails/${sessionStorage.getItem("uid")}/username`,);
    let winInfo = { symbol: symbolName, userName: userName };
    await fb_write(winInfo, `/lobbies/${lobbyName}/winner`);
    endGame("win");
}

async function endGame(outcome) {
    if (outcome == "draw") {
        document.getElementById("endGameHeader").innerHTML = `YOU draw`;
    } else {
        let winInfo = await fb_read(`/lobbies/${lobbyName}/winner`);
        let plural;
        winInfo.symbol == "cross" ? (plural = "es") : (plural = "s");
        document.getElementById("endGameHeader").innerHTML =
            `${winInfo.userName} (${winInfo.symbol}${plural}) wins!`;
    }
    document.getElementById("endScreenDiv").style.visibility = "visible";
    document.getElementById("rematchButton").onclick = () => rematch();
    document.getElementById("leaveButton").onclick = () => leave();
}

function rematch() {
    console.log("rematch");
}

function leave() {
    console.log("leave");
    document.getElementById("endScreenDiv").style.visibility = "hidden";
    document.getElementsByClassName("q5Canvas")[0].style.visibility = "hidden";
    resizeCanvas(1, 1);
    startLobbyScreen();
}
