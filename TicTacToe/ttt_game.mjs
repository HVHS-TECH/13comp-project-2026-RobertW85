/**
 * p5.play: ttt_game.mjs
 * @description features: turn based multiplayer game with scoring system
 * Writen by Robert Watt
 * Term 1-2 2026
 */
import { fb_read, fb_write, fb_waitForChange, fb_removeOnDisconnect, fb_remove, fb_onValue } from "../FireBase/fb_io.mjs";
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
let noughtImage, crossImage;
//lobby info
let boardArray, canMove, players, lobbyName, gameOver;
//player info
let uid, symbolImage, symbolName, turn, username;
//fb
const mmrPath = '/games/TTT/MMR'

window.preload = preload;
window.setup = setup;
window.windowResized = updateScreen;

/**
 * load images
 */
function preload() {
    noughtImage = loadImage("nought.svg");
    crossImage = loadImage("cross.svg");
}

/**
 * automatically hides defualt canvas
 * sets username
 * @returns{void}
 */
async function setup() {
    while (document.getElementsByClassName("q5Canvas") == null) { await new Promise((resolve) => setTimeout(resolve, 100)); }
    document.getElementsByClassName("q5Canvas")[0].style.display = "none";
    username = await fb_read(`/userDetails/${sessionStorage.getItem("uid")}/public/username`,);
}

/**
 * exported so that the game can be started by the lobby mulitple times
 * resets variables and displays game ui
 * @returns{void}
 */
export async function ttt_startGame() {
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
    let lobbyTurn = lobbyData.turn
    //wait incase lobby creator has not completed lobby setup
    while (lobbyTurn == undefined) {
        lobbyTurn = await fb_read(`/lobbies/${lobbyName}/turn`);
        await new Promise((resolve) => setTimeout(resolve, 300));
    }
    //set turn
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
    document.getElementsByClassName("q5Canvas")[0].style.display = "block"
    updateScreen()

    fb_onValue(`/lobbies/${lobbyName}`, async (data) => {
        if (data == null) {
            console.log("no record found")
            lobbyDeleted()
            //remove fb_onValue now
        }
    })

    fb_removeOnDisconnect(`/lobbies/${lobbyName}`)
    gameOver = false
}


/**
 * changes size of canvas
 * redraws sprites and lines
 */
function updateScreen() {
    if (document.getElementsByClassName("q5Canvas")[0].style.display == "none") { return; }
    resizeCanvas(window.innerWidth, window.innerHeight);

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

/**
 * draws 4 lines for the grid
 */
function drawLines() {
    let lineLength = boardSize * LAYOUT.lineLengthScale;
    let lineWidth = boardSize * LAYOUT.lineWidthScale;
    stroke(lineColor);
    strokeWeight(lineWidth);
    line(center.x - lineLength, center.y - boardSize, center.x + lineLength, center.y - boardSize);
    line(center.x - lineLength, center.y + boardSize, center.x + lineLength, center.y + boardSize);
    line(center.x - boardSize, center.y - lineLength, center.x - boardSize, center.y + lineLength);
    line(center.x + boardSize, center.y - lineLength, center.x + boardSize, center.y + lineLength);
}

/**
 * removes all sprites then makes 9 sprites for the board
 */
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
    } else {
        let leave_bt = new Sprite();
        fill(lineColor)
        Object.assign(leave_bt, {
            color: backgroundColor,
            collider: "static",
            text: "leave",
            textSize: 30,
            textColor: lineColor
        })

        let x = 90
        let y = 150
        leave_bt.position = { x, y }
        leave_bt.update = function () {
            if (this.mouse.presses()) {
                leave()
            }
        }
    }
}

/**
 * creates a sprite at x,y
 * the sprites image is dependant on row,column of boardArray
 * @param {float} x 
 * @param {float} y 
 * @param {float} size 
 * @param {int} row 
 * @param {int} column 
 */
function makeSprite(x, y, size, row, column) {
    let sprite = new Sprite();
    Object.assign(sprite, {
        color: backgroundColor,
        scale: size * LAYOUT.spriteScale,
        collider: "static",
        row: row,
        column: column
    })
    sprite.position = { x, y };
    sprite.update = function () {
        if (this.mouse.presses() && turn == true && this.image == null) {
            this.image = symbolImage;
            this.scale = size * LAYOUT.imageScale;
            boardArray[this.row - 1][this.column - 1] = symbolName;
            makeTurn(this.row, this.column, symbolName);
        }
    };
    if (boardArray[row - 1][column - 1] != 0) {
        boardArray[row - 1][column - 1] == "nought" ? sprite.image = noughtImage : sprite.image = crossImage;
        sprite.scale = size * LAYOUT.imageScale;
    } else {
        canMove = true;
    }
}

/**
 * when a move is made check if it will win the game
 * @param {int} row 
 * @param {int} column
 * @param {string} symbol 
 * @returns {void}
 */
async function checkWin(row, column, symbol) {
    //check row in boardArray for horizontal win
    if (boardArray[row - 1][0] == symbol && boardArray[row - 1][1] == symbol && boardArray[row - 1][2] == symbol) {
        winningMove();
    }
    //check column in boardArray for vertical win
    if (boardArray[0][column - 1] == symbol && boardArray[1][column - 1] == symbol && boardArray[2][column - 1] == symbol) {
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

/**
 * updates the lobbies board after making a move
 * checks if the move is a wni
 * ends turn
 * @param {int} row 
 * @param {int} column 
 * @param {string} symbolName 
 * @returns {void}
 */
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

/**
 * waits for turn
 * reads new board
 * checks if there is a winner
 * @returns {void}
 */
async function waitForTurn() {
    await fb_waitForChange(`/lobbies/${lobbyName}/turn`);
    if (await fb_read(`/lobbies/${lobbyName}`) == null) { return }
    //begin turn
    boardArray = await fb_read(`/lobbies/${lobbyName}/board`);
    turn = true;
    updateScreen();
    let winCheck = await fb_read(`/lobbies/${lobbyName}/winner`);
    if (winCheck != undefined) {
        endGame("win");
    }
}

/**
 * writes symbol, username and uid to database after winning
 * @returns {void}
 */
async function winningMove() {
    let winInfo = { symbol: symbolName, username: username, uid: sessionStorage.getItem("uid") };
    await fb_write(winInfo, `/lobbies/${lobbyName}/winner`);
    endGame("win");
}

/**
 * displays endScreen_di
 * @param {string} outcome 
 */
async function endGame(outcome) {
    gameOver = true
    if (outcome == "draw") {
        document.getElementById("endGameHeader_h1").innerHTML = `YOU draw`;
        if (await fb_read(`${mmrPath}/${uid}/MMR`) == null) {
            await fb_write({ MMR: 100, username: username }, `${mmrPath}/${uid}`)
        }
    } else {
        let winInfo = await fb_read(`/lobbies/${lobbyName}/winner`);
        let plural;
        winInfo.symbol == "cross" ? (plural = "es") : (plural = "s");
        document.getElementById("endGameHeader_h1").innerHTML =
            `${winInfo.username} (${winInfo.symbol}${plural}) wins!`;
        calcMmr(winInfo.uid)
    }
    document.getElementById("rematch_bt").style.display = 'block'
    document.getElementById("leave_bt").style.display = 'block'
    document.getElementById("endScreen_di").style.display = 'block'
    document.getElementById("rematch_bt").onclick = () => rematch();
    document.getElementById("leave_bt").onclick = () => leave();
}

function rematch() {
    console.log("rematch");
}

/**
 * hides the game and starts lobby script
 */
function leave() {
    fb_remove(`/lobbies/${lobbyName}`)
    document.getElementById("endScreen_di").style.display = "none";
    document.getElementsByClassName("q5Canvas")[0].style.display = "none";
    startLobbyScreen();
}

/**
 * will update scoreboard for the player depending on the difference of points
 * @param {string} winner 
 * @returns {void}
 */
async function calcMmr(winner) {
    const BASEMMRCHANGE = 10
    let uidLoser = players[0].uid == winner ? players[1].uid : players[0].uid
    let uidWinner = players[0].uid == uidLoser ? players[1].uid : players[0].uid
    let winnerMMR = await fb_read(`${mmrPath}/${uidWinner}/MMR`)
    let loserMMR = await fb_read(`${mmrPath}/${uidLoser}/MMR`)
    let entryIsNull = false
    if (winnerMMR == null) { winnerMMR = 100 }
    if (loserMMR == null) { loserMMR = 100 }
    let averageMMR = (winnerMMR + loserMMR) / 2
    let MMRChange = BASEMMRCHANGE * (loserMMR / averageMMR)
    let newMMR = uid == uidWinner ? winnerMMR + MMRChange : loserMMR - MMRChange
    await fb_write({ MMR: newMMR, username: username }, `${mmrPath}/${uid}`)
}

/**
 * Handle when the other player leaves
 */
async function lobbyDeleted() {
    //to prevent deleting the lobby at the end of the game sending a second message
    if (gameOver == true) { return }
    var leavingPLAYER = players[0].uid == uid ? players[1] : players[0];
    document.getElementById("endGameHeader_h1").innerHTML = `${leavingPLAYER.username} has left`;
    document.getElementById("endScreen_di").style.display = 'block'
    document.getElementById("rematch_bt").style.display = 'none'
    document.getElementById("leave_bt").onclick = () => leave();
}