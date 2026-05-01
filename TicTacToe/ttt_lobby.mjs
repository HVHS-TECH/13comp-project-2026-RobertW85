/***************************
Js: ttt_lobby.mjs

ttt_lobby, features: join or host turn based multiplayer games and display a leaderBoard
Writen by Robert Watt
Term 1-2 2026
***************************/
import { fb_initialize, fb_read, fb_write, fb_onValue, fb_readSorted } from "../FireBase/fb_io.mjs";
import { ttt_startGame } from "./ttt_game.mjs";

let lobbyTable, lobbyDiv;
let uid = sessionStorage.getItem("uid");
fb_initialize();
startLobbyScreen();

//run at the start and by ttt_game when the game is over
//will create the main elements of the lobby
export function startLobbyScreen() {
    lobbyDiv = document.createElement("div");
    lobbyTable = document.createElement("table");
    let lobbyTitle = document.createElement("h1");
    let buttonDiv = document.createElement("div");
    let hostButton = document.createElement("button");
    let refreshButton = document.createElement("button");
    let backButton = document.createElement("button");
    let leaderBoardButton = document.createElement("button");

    document.body.appendChild(lobbyDiv);
    buttonDiv.append(backButton, hostButton, refreshButton, leaderBoardButton);
    lobbyDiv.append(lobbyTitle, buttonDiv, lobbyTable);

    backButton.innerHTML = "Back";
    backButton.onclick = () => { history.back() };
    hostButton.innerHTML = "Host";
    hostButton.onclick = hostLobby;
    refreshButton.innerHTML = "refresh";
    refreshButton.onclick = refreshAvailableLobbies;
    leaderBoardButton.innerHTML = "leaderboard";
    leaderBoardButton.onclick = () => { displayLeaderBoard(5) };
    lobbyTitle.innerHTML = "Tic tac toe Lobby";
    refreshAvailableLobbies();
}

//called by startLobbyScreen and refreshButton
//refreshAvailableLobbies will display every lobby in '/lobbies' that is joinable
//information for each lobby is stored in a table row appeneded to lobbyTable
async function refreshAvailableLobbies() {
    lobbyTable.innerHTML = "";
    const LOBBYLIST = await fb_read("/lobbies");
    if (LOBBYLIST == null) { return; }
    const LOBBYLISTKEYS = Object.keys(LOBBYLIST)
    for (let i = 0; i < LOBBYLISTKEYS.length; i++) {
        if (LOBBYLIST[LOBBYLISTKEYS[i]].players.length >= 2) { continue; }
        let tableRow = document.createElement("tr");
        let lobbyName = document.createElement("td");
        let joinButton = document.createElement("button");
        lobbyName.innerHTML = LOBBYLISTKEYS[i];
        joinButton.innerHTML = "Join";
        joinButton.onclick = () => { joinLobby(LOBBYLISTKEYS[i]) };
        tableRow.append(lobbyName, joinButton);
        lobbyTable.appendChild(tableRow);
    }
}

//called when hostButton is pressed
//it will find a unique name for the lobby
//set up lobby information in firebase '/lobbies/'
//then wait for a player to join
async function hostLobby() {
    document.body.removeChild(lobbyDiv);
    let lobbyList = await fb_read("/lobbies");
    let lobbyNumber;
    if (lobbyList != null) { lobbyNumber = Object.keys(lobbyList).length + 1; }
    else { lobbyNumber = 1; }
    let lobbyData = {
        name: `lobby${lobbyNumber}`,
        players: [await getPlayerData()],
        board: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
    };
    let lobbyName = `lobby${lobbyNumber}`;
    await fb_write(lobbyData, `/lobbies/${lobbyName}`);
    waitForPlayer(lobbyName);
}

//the second half of hostlobby()
//will wait until a player joins then will decide a starting player
//starting player will have cross as their symbol
//turn is stored as the uid of the player whose turn it is
async function waitForPlayer(lobbyName) {
    await fb_onValue(`/lobbies/${lobbyName}/players`);
    let startingPlayer = Math.floor(Math.random() * 2);
    let players = await fb_read(`/lobbies/${lobbyName}/players`);
    let turn = players[startingPlayer].uid;
    //set starting player symbol
    await fb_write("cross", `/lobbies/${lobbyName}/players/${startingPlayer}/symbol`);
    //set last player symbol
    await fb_write("nought", `/lobbies/${lobbyName}/players/${Math.abs(startingPlayer - 1)}/symbol`);
    await fb_write(turn, `/lobbies/${lobbyName}/turn`);
    startGame(lobbyName);
}

//called when pressing a joinButton
//since the player joining a lobby will always be the last it will start the game
async function joinLobby(lobbyName) {
    await fb_write(await getPlayerData(), `/lobbies/${lobbyName}/players/1`);
    document.body.removeChild(lobbyDiv);
    startGame(lobbyName);
}

//used to write player information when joining a lobby
async function getPlayerData() {
    let playerData = {
        uid: uid,
        userName: await fb_read(`/userDetails/${sessionStorage.getItem("uid")}/username`)
    };
    return playerData;
}

//run by both players once a lobby is full
//lobbyName is important for mulitplayer in ttt
function startGame(lobbyName) {
    sessionStorage.setItem("lobbyName", lobbyName);
    ttt_startGame()
}

//used when leaderBoardButton is pressed, size is the amount of players scores displayed
//will make a modal div visible and populate it with data
async function displayLeaderBoard(size) {
    document.getElementById('leaderBoardContent_tb').innerHTML = ''
    let scores = await fb_readSorted("/Games/TTT/MMR", "MMR", size)
    //create table row for each players top scores, containing their username and score
    for (let i = 0; i < scores.length; i++) {
        let entry = document.createElement('tr')
        let name = document.createElement('td')
        let score = document.createElement('td')
        name.innerHTML = scores[i].userName
        score.innerHTML = scores[i].MMR
        entry.append(name, score)
        document.getElementById('leaderBoardContent_tb').append(entry)
    }
    document.getElementById('leaderBoard_di').style.display = 'block'
}

//used to hide leaderboard
window.onclick = function (event) {
    if (event.target == document.getElementById('leaderBoard_di')) {
        document.getElementById('leaderBoard_di').style.display = "none";
    }
}