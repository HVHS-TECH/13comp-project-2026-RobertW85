/***************************
P5.play: rogueGame.js

rogue Game, topdown 2d rogue-like game.
Writen by Robert Watt
Term 1 2025
***************************/
import {
    fb_initialize,
    fb_readSorted,
    fb_read,
    fb_write,
} from "../fireBase/fb_io.mjs";

fb_initialize();

const TILE_GRID_SIZE_X = 50;
const TILE_GRID_SIZE_Y = 26;
const AMOUNT_OF_LEVELS = 2;

const MAX_ROOM_HEIGHT = 10;

let roomAreas = []; //list of rooms for rooms to avoid spawning inside
let tileMap = []; //displayed tile map. visible tiles = tileMap undertilemap = tileMap uppertilemap = spriteArray
let spriteArray = [];
let tiles = 0; //just to allow checks on tiles before it is actually decleared, tiles is the real tile map... tiles = new tilemap
let level = 1; // floor, map level
let tileScale; //size of tiles
let sheetImg;
let gameCanvas;

//player related
let playerSprite;
let playerTileMapx;
let playerTileMapy;
let spawnRoom = []; //where the player starts
let playerStandingOn = "▫";
let playerRoom;
let playing = true; //when false the game is paused
let score = 0;
const player = {
    money: 0,
    maxHealth: 10,
    health: 10,
    level: 1,
    levelProgress: 0,
    levelProgressRequired: 10,
    totalXp: 0,
    strength: 10,
    armor: 0,
};
const PLAYERLEVELS = ["Novice", "Apprentice", "Journeyman", "Expert", "Master"];

let mouseSprite;

//time
let runStarted;
let lastInput = 0;
const MOVE_DELAY = 80;

//https://en.wikipedia.org/wiki/List_of_Unicode_characters
const TILE_ARRAY = [
    //order must match tile map
    //row 0
    [
        ["floor", "▫"],
        ["lightshade", "░"],
        ["solidshade", "▒"],
        ["nextlevel", ">"],
        ["stairs", "/"],
        ["player", "☺"],
        ["horizontalWall", "═"],
        ["empty", "▯"],
        ["horozontalDoor", "╌"],
        ["topRightCorner", "╗"],
        ["verticleDoor", "╬"],
    ],
    //row 1
    [
        ["food", "🍎"],
        ["uparrow", "⇧"],
        ["trap", "◇"],
        ["money", "$"],
        ["enemyCrook", "C"],
        ["verticalWall", "║"],
        ["bottomRightCorner", "╝"],
        ["bottomLeftCorner", "╚"],
        ["topLeftCorner", "╔"],
        ["snake", "S"],
        ["emu", "E"],
        ["mouse", "M"],
    ],
];
const COLLISION_TILES = ["║", "═", "╝", "╚", "▯", "╔", "╗"]; //tiles that the player can't walk over
const ENEMY_TILES = ["C", "S", "E", "M"]; //enemy tiles for .includes()
const ENEMY_STATS = [
    {
        Tile: "C",
        strength: 5,
        health: 10,
        armor: 1,
        xp: 5,
        money: 5,
        movement: "standard",
    },
    {
        Tile: "S",
        strength: 7,
        health: 3,
        armor: 0,
        xp: 8,
        money: 3,
        movement: "standard",
    },
    {
        Tile: "E",
        strength: 15,
        health: 10,
        armor: 4,
        xp: 20,
        money: 5,
        movement: "standard",
    },
    {
        Tile: "M",
        strength: 2,
        health: 3,
        armor: 0,
        xp: 2,
        money: 2,
        movement: "passive",
    },
];
let difficulty = 0.7; //affects enemy stats
/***************************
setup
***************************/

window.preload = preload;
window.setup = setup;
window.draw = draw;

function preload() {
    sheetImg = loadImage("tileSheet8x8.png");
}

function setup() {
    startLoadingScreen(realSetup());
}

/*************************************************
Real Setup() 
this is to allow a loading screen while it generates
*************************************************/
function realSetup() {
    gameCanvas = new Canvas(600, 316, "pixelated x4");
    allSprites.pixelPerfect = true;
    world.gravity.y = 0;
    declearTiles();
    manualGenerate(1); //sets the tile array to a preset layout
    refreshTileMap();
    calculateRoomAreas(); //run after rooms generate
    let enemyPool = getEnemyPool();
    let itemsToAdd = [
        ["$", 4],
        [">", 1],
    ];
    for (let i = 0; i < enemyPool.length; i++) {
        itemsToAdd.push(enemyPool[i]);
    }
    autoAddItems(itemsToAdd);
    tileScale = 8; //place holder that doesn't matter but needs to be here before scale can be found
    refreshTileMap();
    spawnPlayer(); //creates a player sprite based on the spawn room
    windowResized();
    movePlayer([0, 0]); //aligns player
    updatePlayerHealth(0);
    updatePlayerMoney(0);
    spawnSpriteArray();
    refreshTileMap();
    runStarted = Date.now();
    document.getElementById("level").innerText =
        "Rank: " + PLAYERLEVELS[player.level - 1];

    player.money = 10
}

/*************************************************
manualGenerate
contains 2 levels, tile map[1]'s and spawn room data
*************************************************/
function manualGenerate(level) {
    if (level == 1) {
        tileMap = [
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯╔═══════╗▯▯▯▯╔══════╗▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▯▯║▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▒▒╬▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▒▯║▫▫▫▫▫▫║▯▯╔══╗▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫╬▒▒▒▯║▫▫▫▫▫▫╬▒▒║▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▯▯║▫▫▫▫▫▫║▯▒║▫▫╬▒▒▒▒▒▒▒▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▯▯║▫▫▫▫▫▫║▯▒╬▫▫║▯▯▯▯▯▯▒▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▯▯╚══════╝▯▯╚══╝▯▯▯▯▯▯▒▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯╚╌══════╝▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯╔═══╌══╗▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▒▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫║▯▯▯▯",
            "▯▯▯▯▯▯▯▯▒▒▒▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫║▯▯▯▯",
            "▯▯▯▯╔═══╌════╗▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫║▯▯▯▯",
            "▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯╚══════╝▯▯▯▯",
            "▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯╚════════╝▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
        ];
        spawnRoom = [10, 2, 7, 9];
    } else {
        tileMap = [
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▒▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▒▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯╔═══════╌═╗▯▯▯▯▯▯▯▯▯▯▯▯▯▒▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯╔═╌═════╗▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯╚═══════╌═╝▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▒▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫▫▫║▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▒▒▒▒▒▒▒▯▯▯▯▯▯▯▯▯▯▯▯▯╚═══════╝▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▒▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▒▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯╔═══════╌═╗▯▯▯▯▯▯▯▯▯▯▯▯▯╔════════╗▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫▫║▯╔═══╗▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫▫║▯║▫▫▫║▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫▫║▯║▫▫▫║▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫▫║▯║▫▫▫║▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫▫║▒╬▫▫▫║▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯",
            "▯╔═══╗▒╬▫▫▫▫▫▫▫▫▫║▒║▫▫▫║▯▯▯▯▯▯▯║▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯",
            "▯║▫▫▫╬▒║▫▫▫▫▫▫▫▫▫╬▒╚═╌═╝▯▯▒▒▒▒▒╬▫▫▫▫▫▫▫▫║▯▯▯▯▯▯▯▯▯",
            "▯║▫▫▫║▯╚═════════╝▯▯▯▒▒▒▒▒▒▯▯▯▯╚════════╝▯▯▯▯▯▯▯▯▯",
            "▯╚═══╝▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯╔═══╌═╗▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯║▫▫▫▫▫║▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯╚═════╝▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
            "▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯",
        ];
        spawnRoom = [1, 17, 3, 2];
    }
}

/*************************************************
autoAddItems(items)
called by setup(), nextLevel(), reset()
adds items at random to empty floors on tile map

Input:  items = [["tile", amount],["tile2", amount]]
Return: n/a
*************************************************/
function autoAddItems(items) {
    for (let objects = 0; objects < items.length; objects++) {
        let tileChance = findFloorTiles(); //to prevent overlap
        for (let row = 0; row < tileMap.length; row++) {
            for (let column = 0; column < tileMap[row].length; column++) {
                if (tileMap[row][column] === "▫") {
                    if (int(random(1, tileChance)) <= items[objects][1]) {
                        items[objects][1] = items[objects][1] - 1;
                        if (!ENEMY_TILES.includes(items[objects][0])) {
                            //items[objects][0] is not an enemy
                            spriteArray.push([items[objects][0], column, row]);
                        } else {
                            //items[objects][0] is an enemy
                            let enemyStatIndex;
                            for (let index = 0; index < ENEMY_STATS.length; index++) { if (ENEMY_STATS[index].Tile == items[objects][0]) { enemyStatIndex = index; } }
                            spriteArray.push([
                                items[objects][0],
                                column,
                                row,
                                ENEMY_STATS[enemyStatIndex],
                                findRoom(column, row),
                            ]);
                        }
                    } else {
                        if (!items[objects][1] <= 0) {
                            tileChance--;
                        }
                    }
                }
            }
        }
    }
}

/*************************************************
getEnemyPool()
decides what enemys will be in the level
*************************************************/
function getEnemyPool() {
    let totalEnemyXp = 10 * (1 + level * difficulty * 0.3);
    let enemyPool = [];
    let MinEnemyAmount = 2;
    let MaxEnemyAmount = 5;
    let EnemyAmount = int(random(MinEnemyAmount, MaxEnemyAmount));

    for (let enemy = 0; enemy < EnemyAmount; enemy++) {
        let AvalibleEnemies = [];
        for (let a = 0; a < ENEMY_STATS.length; a++) {
            if (ENEMY_STATS[a].xp < totalEnemyXp) {
                AvalibleEnemies.push(ENEMY_STATS[a]);
            }
        }
        if (AvalibleEnemies.length > 0) {
            let SelectedEnemy =
                AvalibleEnemies[int(random(0, AvalibleEnemies.length))];
            totalEnemyXp -= SelectedEnemy.xp;
            enemyPool.push([SelectedEnemy.Tile, 1]);
        }
    }

    return enemyPool;
}

/*************************************************
spawnSpriteArray()
Used to create objects from spriteArray
*************************************************/
function spawnSpriteArray() {
    for (let object = 0; object < spriteArray.length; object++) {
        createSpriteFunc(int(object));
        updateSprite(object);
    }
}

/*************************************************
createSpriteFunc(index)
Used to create objects from spriteArray

Input: index = index of tile inside spriteArray
Return: n/a
*************************************************/
function createSpriteFunc(index) {
    let tile = spriteArray[index][0];
    let sprite = new Sprite();
    let TileMapRow;
    let TileMapCol;

    sprite.width = int(tileScale);
    sprite.height = int(tileScale);
    for (let row = 0; row < TILE_ARRAY.length; row++) {
        for (let column = 0; column < TILE_ARRAY[row].length; column++) {
            if (TILE_ARRAY[row][column][1] == tile) {
                TileMapCol = column;
                TileMapRow = row;
            }
        }
    }
    sprite.spriteSheet = sheetImg;
    sprite.addAni({ w: 8, h: 8, row: TileMapRow, col: TileMapCol });
    sprite.collider = "none";
    sprite.layer = 8;
    spriteArray[index].push(sprite);
}

/*************************************************
updateSprite(index)
used to set a sprite to its spriteArray x,y

Input: index = index of tile inside spriteArray
Return: n/a
*************************************************/
function updateSprite(index) {
    if (spriteArray[index]) {
        for (let i = 0; i < spriteArray[index].length; i++) {
            if (typeof spriteArray[index][i] == "object") {
                if (spriteArray[index][i]._isSprite == true) {
                    spriteArray[index][i].x =
                        spriteArray[index][1] * tileScale + tiles[0].x;
                    spriteArray[index][i].y =
                        spriteArray[index][2] * tileScale + tiles[0].y;
                }
            }
        }
    }
}

/*************************************************
deleteSprite(index)
Removes sprite using spriteArray

Input: index = index of tile inside spriteArray
Return: n/a
*************************************************/

function deleteSprite(index) {
    for (let i = 0; i < spriteArray[index].length; i++) {
        if (typeof spriteArray[index][i] == "object") {
            if (spriteArray[index][i]._isSprite == true) {
                spriteArray[index][i].remove();
            }
        }
    }
}

/*************************************************
declearTiles()
uses TILE_ARRAY to create tiles, uses the index to find tile map position
*************************************************/
function declearTiles() {
    for (let rows = 0; rows < TILE_ARRAY.length; rows++) {
        for (let columns = 0; columns < TILE_ARRAY[rows].length; columns++) {
            createTile(
                TILE_ARRAY[rows][columns][0],
                rows,
                columns,
                TILE_ARRAY[rows][columns][1],
            );
        }
    }
}

/*************************************************
createTile()
part of declearTiles
input = tileName, tileRow, tileCol, tileIdentiy
*************************************************/
function createTile(tileName, tileRow, tileCol, tileIdentity) {
    tileName = new Group();
    tileName.collider = "static";
    tileName.spriteSheet = sheetImg;
    tileName.addAni({ w: 8, h: 8, row: tileRow, col: tileCol });
    tileName.tile = tileIdentity;
}

/*************************************************
createTileMap()
fills tile map with empty space
*************************************************/
function createTileMap() {
    for (let y = 0; y < TILE_GRID_SIZE_Y; y++) {
        let tileRow = "";
        for (let x = 0; x < TILE_GRID_SIZE_X; x++) {
            tileRow += "▯";
            //tileRow += "▫"
            //tileRow += "C"   visibilty of tilemap
        }
        tileMap.push(tileRow);
    }

    refreshTileMap();
}

/*************************************************
replaceTile(x,y,NewTile)
replaces a tile at x,y on tilemap, this will not be displayed until tileMap is refreshed
this fucntion isn't called
input: x, y, NewTile = "T"
return: n/a
*************************************************/
function replaceTile(x, y, newTile) {
    let row = tileMap[y].split("");
    row[x] = newTile;
    row = row.join("");
    tileMap[y] = row;
}

/*************************************************
refreshTileMap
*************************************************/
function refreshTileMap() {
    for (let object = 0; object < spriteArray.length; object++) {
        updateSprite(object);
    }
    if (tiles.length > 0) {
        tiles.removeAll();
    }
    tiles = new Tiles([...tileMap], width / 2 - 200, height / 2 - 104, 8, 8);
    tiles.layer = 1;
}

/*************************************************
calcRoomSpace(roomLocationX, roomLocationY, roomWidth, roomHieght)
returns every coordanite within the room's area

Input: roomLocationX, roomLocationY, roomWidth, roomHieght
Return: coordinates = ([x,y],[x,y],[x,y],[x,y])
*************************************************/
function calcRoomSpace(roomLocationX, roomLocationY, roomWidth, roomHieght) {
    let coordinates = [];
    for (let y = 0; y < roomHieght + 2; y++) {
        for (let x = 0; x < roomWidth + 2; x++) {
            coordinates.push([int(roomLocationX + x), int(roomLocationY + y)]);
        }
    }
    return coordinates;
}

/*************************************************
spawnPlayer()
spawnRoom[x,y, width,height]
creates playerSprite
sets player location to middle of the spawn room
*************************************************/
function spawnPlayer() {
    playerSprite = new Sprite();
    playerSprite.width = int(tileScale);
    playerSprite.height = int(tileScale);
    playerSprite.spriteSheet = sheetImg;
    playerSprite.addAni({ w: 8, h: 8, row: 0, col: 5 });
    playerSprite.collider = "none";
    playerSprite.layer = 9;

    let newLoctaion = [
        spawnRoom[0] + int(spawnRoom[2] / 2) + 1,
        spawnRoom[1] + int(spawnRoom[3] / 2) + 1,
    ];
    changePlayerPosition(newLoctaion);
}

/*************************************************
movePlayer(derection[x,y])
derection is from draw loop movements, eg [0,1] for moving 1 y
Checks if the new location is valid (within TILE_GRID_SIZE, not on a collision tile)
if moving to enemy fight instead of moving
if the player is in the same room as an enemy the enemy will move towards the player
*************************************************/
function movePlayer(derection) {
    let newLoctaion = [
        playerTileMapx + derection[0],
        playerTileMapy + derection[1],
    ];

    if (newLoctaion[1] >= 0) {
        let newPlayerStandingOn = checkTile(newLoctaion[0], newLoctaion[1]);
        if (
            newLoctaion[0] >= 0 &&
            newLoctaion[0] <= TILE_GRID_SIZE_X - 1 &&
            newLoctaion[1] <= TILE_GRID_SIZE_Y - 1 &&
            newLoctaion[1] >= 0 &&
            COLLISION_TILES.includes(newPlayerStandingOn) != true
        ) {
            if (ENEMY_TILES.includes(newPlayerStandingOn)) {
                fightEnemy(newLoctaion[0], newLoctaion[1]);
            } else {
                playerStandingOn = newPlayerStandingOn;
                changePlayerPosition(newLoctaion);
            }
            if (playerRoom != "hallWay") {
                enemyMove();
            }
        }
    }
}

/*************************************************
changePlayerPosition(newLoctaion)
newlocation[x,y] is the location of the player on the tile map
then the playerSprite location is set to tileMapPosition * Tile scale, with an offset based of tiles[0]'s position
*************************************************/
function changePlayerPosition(newLoctaion) {
    playerTileMapx = newLoctaion[0];
    playerTileMapy = newLoctaion[1];

    let position = [playerTileMapx * tileScale, playerTileMapy * tileScale];

    playerSprite.y = position[1] + tiles[0].y;
    playerSprite.x = position[0] + tiles[0].x;
    playerRoom = findRoom(playerTileMapx, playerTileMapy);

    playerStandingOn = checkTile(playerTileMapx, playerTileMapy);

    if (playerStandingOn === "$") {
        for (let i = 0; i < spriteArray.length; i++) {
            if (
                spriteArray[i][1] === playerTileMapx &&
                spriteArray[i][2] === playerTileMapy
            ) {
                deleteSprite(i);
                spriteArray.splice(i, 1);
                updatePlayerMoney(5); //could be a random number
            }
        }
    }
}

/*************************************************
checkTile(x,y)
find tile at x,y
proitises objects
Input: x,y
Return: tileMap0[x] = "T"
*************************************************/

function checkTile(x, y) {
    for (let object = 0; object < spriteArray.length; object++) {
        if (spriteArray[object][1] == x && spriteArray[object][2] == y) {
            return spriteArray[object][0];
        }
    }
    let tileMap0 = tileMap[y].split("");
    return tileMap0[x];
}

/*************************************************
mouseCheck()
WIP, going to be used to give user info about what tile they are looking at
*************************************************/
function mouseCheck() {
    let x = mouse.x + tileScale / 2 - tiles[0].x;
    let y = mouse.y + tileScale / 2 - tiles[0].y;

    x = int(x / tileScale);
    y = int(y / tileScale);

    if (x <= TILE_GRID_SIZE_X && x >= 0 && y >= 0 && y < TILE_GRID_SIZE_Y) {
        if (mouseSprite == null) {
            mouseSprite = new Sprite();
            mouseSprite.width = 8;
            mouseSprite.height = 8;
            mouseSprite.layer = 20;
            mouseSprite.collider = "none";
        } else {
            mouseSprite.visible = true;
            mouseSprite.x = x * tileScale + tiles[0].x;
            mouseSprite.y = y * tileScale + tiles[0].y;
        }
    } else {
        if (mouseSprite != null) {
            mouseSprite.visible = false;
        }
    }
}

/*************************************************
windowResized
sets tile scale, might be uneeded as it seems to work with values inside the canvas rather than the screen px
*************************************************/
function windowResized() {
    if (tiles.length) {
        tileScale = tiles[1].x - tiles[0].x;
        playerSprite.width = int(tileScale);
        playerSprite.height = int(tileScale);
    }
}

/*************************************************
nextLevel
changes the level, increases difficulty
wins the game if AMOUNT_OF_LEVELS is reached, this could be replaced with some sort of harder final level
*************************************************/
function nextLevel() {
    level++;
    if (AMOUNT_OF_LEVELS < level) {
        endGame("Win");
    } else {
        for (let object = 0; object < spriteArray.length; object++) {
            deleteSprite(object);
        }
        difficulty *= 1.1;
        spriteArray = [];
        tileMap = [];
        manualGenerate(2);
        calculateRoomAreas();
        let enemyPool = getEnemyPool();
        let itemsToAdd = [
            ["$", 4],
            [">", 1],
        ];
        for (let i = 0; i < enemyPool.length; i++) {
            itemsToAdd.push(enemyPool[i]);
        }
        autoAddItems(itemsToAdd);
        spawnSpriteArray();
        let newLoctaion = [
            spawnRoom[0] + int(spawnRoom[2] / 2) + 1,
            spawnRoom[1] + int(spawnRoom[3] / 2) + 1,
        ];
        changePlayerPosition(newLoctaion);
        refreshTileMap();
    }
}

/*************************************************
findFloorTiles
Finds every floor tile (▫) on tile map 0
Input: N/a
Return: emptyTiles = number of ▫
*************************************************/
function findFloorTiles() {
    refreshTileMap(); //to add tile map 2 over tilemap 0,  to prevent overlap for adding tiles
    let emptyTiles = 0;
    //search for every empty floor space inside tile map 1
    for (let row = 0; row < tileMap.length; row++) {
        for (let column = 0; column < tileMap[row].length; column++) {
            if (tileMap[row][column] === "▫") {
                emptyTiles++;
            }
        }
    }
    return emptyTiles;
}

/*************************************************
fightEnemy
The enemy is based on the xy of the enemy, then it searchs spriteArray for the enemy
Enemy stats are multiplied by difficulty
*************************************************/
function fightEnemy(x, y) {
    let enemyIndex;
    for (let index = 0; index < spriteArray.length; index++) {
        if (spriteArray[index][1] == x && spriteArray[index][2] == y) {
            enemyIndex = index;
        }
    }
    if (enemyIndex) {
        let enemy = spriteArray[enemyIndex][3];
        let enemyHealth = enemy.health * difficulty;
        //enemy attacks player
        updatePlayerHealth(
            int((enemy.strength * difficulty) / (1 + player.armor * 0.5)),
        );
        //player attacks enemy
        enemyHealth -= int(
            player.strength / (1 + enemy.armor * difficulty * 0.5),
        );
        if (enemyHealth <= 0) {
            updatePlayerLevel(spriteArray[enemyIndex][3].xp);
            updatePlayerMoney(spriteArray[enemyIndex][3].money);
            deleteSprite(enemyIndex);
            spriteArray.splice([enemyIndex], 1);
        } else {
            spriteArray[enemyIndex][3].health = enemyHealth / difficulty;
        }
    }
}

/*************************************************
updatePlayerLevel
Player xp system is based on levelprogress reaching levelprogress required
Total xp is just used for score
*************************************************/
function updatePlayerLevel(xp) {
    player.totalXp += xp;
    player.levelProgress += xp;
    //amount of xp needed to level up
    if (player.levelProgress >= player.levelProgressRequired) {
        player.level += 1;
        player.levelProgress -= player.levelProgressRequired;
        player.levelProgressRequired *= 1.4;

        if (PLAYERLEVELS.length >= player.level) {
            document.getElementById("level").innerText =
                "Rank: " + PLAYERLEVELS[player.level - 1];
        }
    }
}

function updatePlayerHealth(health) {
    player.health -= health;
    if (player.health <= 0) {
        endGame("Lose")
        document.getElementById("health").innerText =
            "Health: 0/" + int(player.maxHealth).toString();
    } else {
        document.getElementById("health").innerText =
            "Health: " +
            int(player.health).toString() +
            "/" +
            int(player.maxHealth).toString();
    }
}

function updatePlayerMoney(money) {
    player.money += money;
    document.getElementById("money").innerText =
        "Money: " + int(player.money).toString();
}

/*************************************************
win and lose, could be the same function
*************************************************/

async function endGame(result) {
    playing = false;
    await calculateScore();
    let writtenScore = await fb_read("/games/rogue/scores/" + sessionStorage.getItem("uid") + "/score",);
    if (writtenScore != null) {
        middlePopup(`${result}`, `Score: ${int(score)} \n High Score: ${int(writtenScore)}`);
    } else {
        middlePopup(`${result}`, `Score: ${int(score)} \n High Score: ${score}`);
    }
}

/*************************************************
Calculate Score
Score is (money + xp) * time
lower time is better, score starts *2 then lowers to a min of *0.5 based on time
No differnce between win/lose but If there was a leaderboard any win would be better than a loss
*************************************************/
async function calculateScore() {
    let timeMultiplier = 2 - int((Date.now() - runStarted) / 1000) / 60; //score is timed by 2 - amount of minutes limit of 0.5
    if (timeMultiplier < 0.5) {
        timeMultiplier = 0.5;
    }
    score = (player.money + player.totalXp) * timeMultiplier;
    score = int(score);
    await fb_read(
        "/games/rogue/scores/" + sessionStorage.getItem("uid") + "/score",
    ).then(async (result) => {
        if (!result) {
            //no previous score
            let entry = { score: score, gameName: await fb_read(`/userDetails/${sessionStorage.getItem("uid")}/public/username`) }
            await fb_write(entry, "/games/rogue/scores/" + sessionStorage.getItem("uid"))
        } else if (result < score) {
            //update high score
            await fb_write(score, "/games/rogue/scores/" + sessionStorage.getItem("uid") + "/score",);
        }
    });
    return
}

/*************************************************
Middle popup
Creates an element in the middle of the screen
Used for lose/win 
*************************************************/
function middlePopup(title, content) {
    let screenBackground = document.createElement("div");
    let contentBox_di = document.createElement("div");
    let titleElement = document.createElement("p");
    let textElement_p = document.createElement("p");
    //let winScreenBr = document.createElement("br")
    let mainMenuButton = document.createElement("button");
    let playAgainButton = document.createElement("button");
    let leaderBoard = document.createElement("div");

    screenBackground.id = "screenBackground";
    contentBox_di.id = "contentBox_di";
    titleElement.id = "title";
    textElement_p.id = "textElement_p";
    mainMenuButton.classList.add("popUpButton");
    playAgainButton.classList.add("popUpButton");
    leaderBoard.id = "leaderBoard";

    titleElement.innerText = title;
    textElement_p.innerText = content;
    mainMenuButton.innerHTML = "Main Menu";
    playAgainButton.innerHTML = "Play Again";

    mainMenuButton.onclick = function () {
        window.location.href = "/index.html";
    };
    playAgainButton.onclick = function () {
        startLoadingScreen(reset());
    };

    contentBox_di.appendChild(titleElement);
    contentBox_di.appendChild(textElement_p);
    screenBackground.appendChild(contentBox_di);
    //contentBox_di.appendChild(winScreenBr)
    contentBox_di.appendChild(leaderBoard);
    contentBox_di.appendChild(mainMenuButton);
    contentBox_di.appendChild(playAgainButton);

    document.body.appendChild(screenBackground);

    populateLeaderBoard()
}

/*************************************************
populateLeaderBoard()
*************************************************/
async function populateLeaderBoard() {
    let list = await fb_readSorted("/games/rogue/scores", "score", 3)
    let lb_Table = document.createElement("table");
    if (list == null) { return }
    for (let i = 0; i < list.length; i++) {
        if (list[i].gameName) {
            let lb_Entry = document.createElement("tr");
            let Name = document.createElement("td");
            Name.innerHTML = list[i].gameName.slice(0, 5);
            lb_Entry.appendChild(Name);
            let Score = document.createElement("td");
            Score.innerHTML = list[i].score;
            lb_Entry.appendChild(Score);
            lb_Table.appendChild(lb_Entry);
        }
    }
    document.getElementById("leaderBoard").appendChild(lb_Table);
}

/*************************************************
Resest Function
Resets Vars to defualts
Starts game again
*************************************************/

function reset() {
    playerSprite.remove();
    for (let object = 0; object < spriteArray.length; object++) {
        deleteSprite(object);
    }

    playing = true;
    roomAreas = [];
    tileMap = [];
    spriteArray = [];
    tiles = 0;
    level = 1;

    //player related
    playerTileMapx = 0;
    playerTileMapy = 0;
    spawnRoom = [];
    playerStandingOn = "▫";
    ((player.money = 0), (player.maxHealth = 10));
    player.health = 10;
    player.level = 1;
    player.levelProgress = 1;
    player.totalXp = 0;
    player.strength = 10;
    player.armor = 0;
    score = 0;
    lastInput = 0;

    const POPUP = document.getElementsByClassName("screenBackground")[0];
    POPUP.remove();

    //autoGenerate()
    manualGenerate(1);
    calculateRoomAreas();
    let enemyPool = getEnemyPool();
    let itemsToAdd = [
        ["$", 4],
        [">", 1],
    ];
    for (let i = 0; i < enemyPool.length; i++) {
        itemsToAdd.push(enemyPool[i]);
    }
    autoAddItems(itemsToAdd);
    refreshTileMap();
    spawnPlayer();
    windowResized();
    movePlayer([0, 0]);
    updatePlayerHealth(0);
    updatePlayerMoney(0);
    spawnSpriteArray();
    refreshTileMap();
    runStarted = Date.now();
}

/*************************************************
Loading Screen
StartLoadingScreen Will load a loadingScreen
Runs the parsed Fucntion
Removes the LoadingScreen

this is broken, it will run the function then once the funcion is loaded it will load the loading screen then instantly delete it
*************************************************/

function startLoadingScreen(func) {
    loadingScreenHandler();
    eval(func);
    removeElementUsingClass("loadingScreen", 0);
}

function loadingScreenHandler() {
    let screen = document.createElement("div");
    let loadingtext = document.createElement("p");

    loadingtext.innerText = "loading...";
    loadingtext.classList.add("loadingText");
    screen.appendChild(loadingtext);

    screen.classList.add("loadingScreen");
    document.body.appendChild(screen);
    draw();
}

/*************************************************
Remove Element Using Class
*************************************************/

function removeElementUsingClass(className, index) {
    const ELEMENT = document.getElementsByClassName(className)[index];
    ELEMENT.remove();
}

/*************************************************
Calcuate Room Areas
Finds the top left corner, tracks until it finds top right corner then goes down to find the bottom right corner
Important corners = [top left corner, bottom right corner], for each room
Then calcuates all coordanites inside each room
*************************************************/
function calculateRoomAreas() {
    roomAreas.clear;
    let startpointTop; //[x, y]
    let endpointTop; //[x,y]
    let findingTop = false;

    let endpointBottom;
    let importantRoomCorners = []; //contains top left corner and bottom right corner

    for (let rows = 0; rows < tileMap.length; rows++) {
        for (let column = 0; column < tileMap[rows].length; column++) {
            let tile = tileMap[rows][column];
            if (tile === "╔") {
                findingTop = true;
                startpointTop = [int(column), int(rows)];
            }
            if ((findingTop = true)) {
                if (tileMap[rows][column] === "╗") {
                    findingTop = false;
                    endpointTop = [int(column), int(rows)];

                    //find amount that it can search downwards
                    let heightSearchMax = MAX_ROOM_HEIGHT + 2;
                    if (int(rows) + heightSearchMax > TILE_GRID_SIZE_Y) {
                        heightSearchMax = TILE_GRID_SIZE_Y;
                    }

                    for (
                        let tempHeightSearch = 0;
                        tempHeightSearch < heightSearchMax;
                        tempHeightSearch++
                    ) {
                        if (tileMap[rows + tempHeightSearch] != undefined) {
                            if (
                                tileMap[rows + tempHeightSearch][column] === "╝"
                            ) {
                                endpointBottom = [
                                    int(column),
                                    int(rows + tempHeightSearch - 1),
                                ];
                                importantRoomCorners.push([
                                    startpointTop,
                                    endpointBottom,
                                ]);
                            }
                        }
                    }
                }
            }
        }
    }
    for (let room = 0; room < importantRoomCorners.length; room++) {
        let width =
            importantRoomCorners[room][1][0] - importantRoomCorners[room][0][0];
        let height =
            importantRoomCorners[room][1][1] - importantRoomCorners[room][0][1];
        let locationX = importantRoomCorners[room][0][0];
        let locationY = importantRoomCorners[room][0][1];
        roomAreas.push(calcRoomSpace(locationX, locationY, width, height));
    }
}

/*************************************************
FindRoom
Takes x,y and finds the room inside roomAreas that the position contains
*************************************************/

function findRoom(x, y) {
    let room;
    for (let rooms = 0; rooms < roomAreas.length; rooms++) {
        for (
            let coordinate = 0;
            coordinate < roomAreas[rooms].length;
            coordinate++
        ) {
            if (
                roomAreas[rooms][coordinate][0] === x &&
                roomAreas[rooms][coordinate][1] === y
            ) {
                room = int(rooms);
            }
        }
    }
    if (room === undefined) {
        room = "hallWay";
    }
    return room;
}

/*************************************************
Enemy Move
Enemies will move if in the same room as the player
if the enemy's next position will not have the same or y as player it will pick one at random to get closer to the player   (this should be changed to current position not next position)
else it will pick the only option
if the enemy cant not move closer to the player without going to the players y or x (this means the enemy is diagonal from the player) it will pick one at random
if the enemy is adjacent to the player it will move to attack the player
*************************************************/

function enemyMove() {
    for (let tile = 0; tile < spriteArray.length; tile++) {
        if (ENEMY_TILES.includes(spriteArray[tile][0])) {
            if (spriteArray[tile][4] == playerRoom) {
                let enemyMoved = false;
                if (spriteArray[tile][3].movement == "standard") {
                    let enemyX = spriteArray[tile][1];
                    let enemyY = spriteArray[tile][2];
                    let canMoveX = false;
                    let canMoveY = false;

                    if (enemyX < playerTileMapx) {
                        enemyX++;
                    } else {
                        if (enemyX > playerTileMapx) {
                            enemyX--;
                        }
                    }
                    if (enemyY < playerTileMapy) {
                        enemyY++;
                    } else {
                        if (enemyY > playerTileMapy) {
                            enemyY--;
                        }
                    }

                    if (enemyX != playerTileMapx) {
                        canMoveX = true;
                    } //can move is to stop the enemy from going ontop of player
                    if (enemyY != playerTileMapy) {
                        canMoveY = true;
                    }

                    if (COLLISION_TILES.includes(checkTile(enemyX, enemyY))) {
                    } else {
                        if (canMoveX && canMoveY) {
                            let i = int(random(0, 1));
                            if (i == 0) {
                                spriteArray[tile][1] = enemyX;
                            } else {
                                spriteArray[tile][2] = enemyY;
                            }
                            enemyMoved = true;
                        } else {
                            if (canMoveX) {
                                spriteArray[tile][1] = enemyX;
                                enemyMoved = true;
                            } else {
                                if (canMoveY) {
                                    spriteArray[tile][2] = enemyY;
                                    enemyMoved = true;
                                } else {
                                    //can't move x or y
                                    if (
                                        spriteArray[tile][1] !=
                                        playerTileMapx &&
                                        spriteArray[tile][1] != playerTileMapy
                                    ) {
                                        //check current x and y to check if it is diagonal
                                        let i = int(random(0, 1));
                                        if (i == 0) {
                                            spriteArray[tile][1] =
                                                playerTileMapx;
                                        } else {
                                            spriteArray[tile][2] =
                                                playerTileMapY;
                                        }
                                        fightEnemy(
                                            spriteArray[tile][1],
                                            spriteArray[tile][2],
                                        ); //this might be removed it just looks weird when they follow the player like this
                                        enemyMoved = true;
                                    } else {
                                        if (
                                            enemyX == playerTileMapx &&
                                            enemyY == playerTileMapy
                                        ) {
                                            //enemy is trying to touch player space
                                            fightEnemy(
                                                spriteArray[tile][1],
                                                spriteArray[tile][2],
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else if (spriteArray[tile][3].movement == "passive") {
                    let enemyX = spriteArray[tile][1];
                    let enemyY = spriteArray[tile][2];

                    let i = int(random(0, 4));
                    if (i == 0) {
                        enemyX += 1;
                    } else if (i == 1) {
                        enemyX -= 1;
                    } else if (i == 2) {
                        enemyY += 1;
                    } else {
                        enemyY -= 1;
                    }
                    if (COLLISION_TILES.includes(checkTile(enemyX, enemyY))) {
                    } else {
                        enemyMoved = true;
                        spriteArray[tile][1] = enemyX;
                        spriteArray[tile][2] = enemyY;
                    }
                }
                if (enemyMoved === true) {
                    updateSprite(tile);
                }
            }
        }
    }
}

/*************************************************
draw
*************************************************/

function draw() {
    clear();
    background("black");
    if (playing) {
        if (Date.now() > lastInput + MOVE_DELAY) {
            lastInput = Date.now();

            if (kb.pressing("left") || kb.pressing("A")) {
                movePlayer([-1, 0]);
            }
            if (kb.pressing("right") || kb.pressing("D")) {
                movePlayer([1, 0]);
            }
            if (kb.pressing("up") || kb.pressing("W")) {
                movePlayer([0, -1]);
            }
            if (kb.pressing("down") || kb.pressing("S")) {
                movePlayer([0, 1]);
            }
            if (kb.pressing("space")) {
                //to move enimes
                movePlayer([0, 0]);
            }
        }

        if (kb.pressing("enter")) {
            if (checkTile(playerTileMapx, playerTileMapy) === ">") {
                nextLevel();
            }
        }

        document.getElementById("time").innerText =
            "Time Multiplier: " +
            int(
                (2 - int((Date.now() - runStarted) / 1000) / 60) * 100,
            ).toString() +
            "%";
    }
}
