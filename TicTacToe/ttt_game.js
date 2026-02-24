let canvas;
let lineColor = (13,161, 146);
let backgroundColor = (20, 189, 172);

let nought;
let cross;
let boardarray = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
]

function preload(){
    nought = loadImage('nought.svg');
    cross = loadImage('cross.svg');
}

function setup() {
    canvas = createCanvas();
    updateScreen()
}

function windowResized(){
    resizeCanvas(window.innerWidth, window.innerHeight);
    updateScreen(); 
}

function updateScreen(){
    background(backgroundColor);

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;
    let boardSize = min(screenWidth, screenHeight) * 0.1;
    let center = createVector(screenWidth / 2, screenHeight / 2);
    let lineLength = boardSize * 2.7;

    stroke(lineColor);
    strokeWeight(boardSize * 0.2);

    line(center.x-lineLength, center.y-boardSize, center.x+lineLength, center.y-boardSize);
    line(center.x-lineLength, center.y+boardSize, center.x+lineLength, center.y+boardSize);
    line(center.x-boardSize, center.y-lineLength, center.x-boardSize, center.y+lineLength);
    line(center.x+boardSize, center.y-lineLength, center.x+boardSize, center.y+lineLength);

    strokeWeight(0);
    refreshSprites(boardSize, center);
}

function refreshSprites(boardSize, center){
    allSprites.remove();

    let spriteSize  = boardSize/50;

    //row 1
    makeSprite(center.x-boardSize*2, center.y-boardSize*2, spriteSize, 1, 1);
    makeSprite(center.x, center.y-boardSize*2, spriteSize, 1, 2);
    makeSprite(center.x+boardSize*2, center.y-boardSize*2, spriteSize, 1, 3);
    //row 2
    makeSprite(center.x-boardSize*2, center.y, spriteSize, 2, 1);
    makeSprite(center.x, center.y, spriteSize, 2, 2);
    makeSprite(center.x+boardSize*2, center.y, spriteSize, 2, 3);

    //row 3
    makeSprite(center.x-boardSize*2, center.y+boardSize*2, spriteSize, 3, 1);
    makeSprite(center.x, center.y+boardSize*2, spriteSize, 3, 2);
    makeSprite(center.x+boardSize*2, center.y+boardSize*2, spriteSize, 3, 3);
}

function makeSprite(x, y, size, row, column){
    let sprite = new Sprite();
    sprite.color = backgroundColor;
    sprite.scale = size * 1.8;
    sprite.position.x = x;
    sprite.position.y = y;
    sprite.collider = 'static';
    sprite.row = row;
    sprite.column = column;
    sprite.update = function(){
        if(this.mouse.presses()){
            this.image = nought;
            this.scale = size;
            print(this.row, this.column);
            boardarray[this.row-1][this.column-1] = 'nought';
            checkWin(this.row, this.column, 'nought');
        }
    }
}

//test if new placement will win
// check row/column of x and y then both diagonals
function checkWin(x,y,symbol){
    //check row in boardarray for horizontal win
    if(boardarray[x-1][0] == symbol && boardarray[x-1][1] == symbol && boardarray[x-1][2] == symbol){
        print('win', x, 'row');
    }
    //check column in boardarray for vertical win
    if(boardarray[0][y-1] == symbol && boardarray[1][y-1] == symbol && boardarray[2][y-1] == symbol){
        print('win', y, 'column');
    }
    //since diagonals only happen in 2 cases it is easy to be lazy
    //check diagonal from top-left to bottom-right
    if(boardarray[0][0] == symbol && boardarray[1][1] == symbol && boardarray[2][2] == symbol){
        print('win', 'diagonal');
    }
    //check diagonal from top-right to bottom-left
    if(boardarray[0][2] == symbol && boardarray[1][1] == symbol && boardarray[2][0] == symbol){
        print('win', 'diagonal');
    }
}


this.preload = preload;
this.setup = setup;
this.windowResized = windowResized;