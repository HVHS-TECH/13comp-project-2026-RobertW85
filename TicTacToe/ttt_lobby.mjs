/**
 * Js: ttt_lobby.mjs
 * @description features: join or host turn based multiplayer games and display a leaderBoard
 * Writen by Robert Watt
 * Term 1-2 2026
 */
import { fb_initialize, fb_read, fb_write, fb_waitForChange, fb_readSorted, fb_remove, fb_removeOnDisconnect, fb_onValue } from "../FireBase/fb_io.mjs";
import { ttt_startGame } from "./ttt_game.mjs";

let lobbyTable, lobby_di;
let autoRefreshLastLength = 0;
let uid = sessionStorage.getItem("uid");
fb_initialize();
startLobbyScreen();

/**
 * create the main elements of the lobby
 */
export function startLobbyScreen() {
    lobby_di = document.createElement("div");
    lobbyTable = document.createElement("table");
    let lobbyTitle = document.createElement("h1");
    let buttonDiv = document.createElement("div");
    let hostButton = document.createElement("button");
    let refreshButton = document.createElement("button");
    let backButton = document.createElement("button");
    let leaderBoardButton = document.createElement("button");

    document.body.appendChild(lobby_di);
    buttonDiv.append(backButton, hostButton, refreshButton, leaderBoardButton);
    lobby_di.append(lobbyTitle, buttonDiv, lobbyTable);

    lobby_di.className = 'centered'
    backButton.innerHTML = "Back";
    backButton.onclick = () => { history.back() };
    hostButton.innerHTML = "Host";
    hostButton.onclick = hostLobby;
    refreshButton.innerHTML = "Refresh";
    refreshButton.onclick = refreshAvailableLobbies;
    leaderBoardButton.innerHTML = "Leaderboard";
    leaderBoardButton.onclick = () => { displayLeaderBoard(5) };
    lobbyTitle.innerHTML = "Tic tac toe Lobby";
    refreshAvailableLobbies();
    fb_onValue('/lobbies', (read) => {
        if (read == null) { refreshAvailableLobbies(); return }
        if (autoRefreshLastLength != Object.values(read).length) {
            autoRefreshLastLength = Object.values(read).length
            refreshAvailableLobbies()
        }
    })
}

/**
 * display every lobby in '/lobbies' that is joinable
 * information for each lobby is stored in a table row appeneded to lobbyTable
 * @returns {void}
 */
async function refreshAvailableLobbies() {
    lobbyTable.innerHTML = "";
    const LOBBYLIST = await fb_read("/lobbies");
    if (LOBBYLIST == null) { return; }
    const LOBBYLISTKEYS = Object.keys(LOBBYLIST)
    for (let i = 0; i < LOBBYLISTKEYS.length; i++) {
        if (LOBBYLIST[LOBBYLISTKEYS[i]].players.length >= 2) continue;
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

/** 
 * find a unique name for the lobby
 * set up lobby information in firebase '/lobbies/'
 * then wait for a player to join
 */
async function hostLobby() {
    document.body.removeChild(lobby_di);
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

/**
 * will wait until a player joins then will decide a starting player
 * starting player will have cross as their symbol
 * turn is stored as the uid of the player whose turn it is
 * @param {string} lobbyName 
 * @returns {void}
 */
async function waitForPlayer(lobbyName) {
    let wait_di = document.createElement('div')
    let wait_bt = document.createElement('button')
    let wait_h2 = document.createElement('h2')
    wait_bt.innerText = 'Back'
    wait_h2.innerText = 'Waiting for a player to join'
    wait_h2.className = 'centered'
    wait_bt.onclick = async () => {
        wait_bt.remove()
        wait_bt = undefined
        wait_h2.remove()
        await fb_remove(`/lobbies/${lobbyName}`)
        startLobbyScreen()
        return
    }
    wait_di.className = 'centered'
    wait_di.append(wait_h2, wait_bt)
    document.body.append(wait_di)
    fb_removeOnDisconnect(`/lobbies/${lobbyName}`)
    await fb_waitForChange(`/lobbies/${lobbyName}/players`);
    if (wait_bt == undefined) return;
    wait_bt.remove()
    wait_h2.remove()
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

/**
 * the player joining a lobby will be the last, it will start the game
 * @returns {void}
 */
async function joinLobby(lobbyName) {
    await fb_write(await getPlayerData(), `/lobbies/${lobbyName}/players/1`);
    document.body.removeChild(lobby_di);
    startGame(lobbyName);
}

/**
 * used to write player information when joining a lobby
 */
async function getPlayerData() {
    let playerData = {
        uid: uid,
        username: await fb_read(`/userDetails/${sessionStorage.getItem("uid")}/public/username`)
    };
    return playerData;
}

/**
 * run by both players once a lobby is full
 * lobbyName is important for mulitplayer in ttt
 */
function startGame(lobbyName) {
    sessionStorage.setItem("lobbyName", lobbyName);
    ttt_startGame()
}

/**
 * used when leaderBoardButton is pressed, size is the amount of players scores displayed
 * will make a modal div visible and populate it with data
 */
async function displayLeaderBoard(size) {
    document.getElementById('leaderBoardContent_tb').innerHTML = ''
    let scores = await fb_readSorted("/games/TTT/MMR", "MMR", size)
    //create table row for each players top scores, containing their username and score
    if (scores == null) { console.log('scores == null'); return };
    for (let i = 0; i < scores.length; i++) {
        let entry = document.createElement('tr')
        let name = document.createElement('td')
        let score = document.createElement('td')
        name.innerHTML = scores[i].username
        score.innerHTML = int(scores[i].MMR)
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