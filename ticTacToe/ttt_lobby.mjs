/**
 * ttt_lobby.mjs
 * @description features: join or host turn based multiplayer games and display a leaderBoard
 * Writen by Robert Watt
 * Term 1-2 2026
 */
import { fb_initialize, fb_read, fb_write, fb_waitForChange, fb_readSorted, fb_remove, fb_removeOnDisconnect, fb_onValue } from "../fireBase/fb_io.mjs";
import { ttt_startGame } from "./ttt_game.mjs";

let lobbyTable, lobby_di;
let autoRefreshLastLength = 0;
let uid = sessionStorage.getItem("uid");
let username;
fb_initialize();
startLobbyScreen();

/**
 * create the main elements of the lobby
 */
export function startLobbyScreen() {
    if(sessionStorage.getItem("uid") == null){alert("must sign in!");return}
    lobby_di = document.createElement("div");
    lobbyTable = document.createElement("table");
    let lobbyTitle = document.createElement("h1");
    let buttonDiv = document.createElement("div");
    let hostButton = document.createElement("button");
    let backButton = document.createElement("button");
    let leaderBoardButton = document.createElement("button");

    document.body.appendChild(lobby_di);
    buttonDiv.append(backButton, hostButton, leaderBoardButton);
    lobby_di.append(lobbyTitle, buttonDiv, lobbyTable);

    buttonDiv.id = 'titleButtons_di';
    lobby_di.className = 'centered';
    backButton.innerHTML = "Back";
    backButton.onclick = () => { history.back() };
    hostButton.innerHTML = "Create Lobby";
    hostButton.onclick = hostLobby;
    leaderBoardButton.innerHTML = "Leaderboard";
    leaderBoardButton.onclick = () => { displayLeaderBoard(5) };
    lobbyTitle.innerHTML = "Tic Tac Toe Lobby";

    [backButton, hostButton, leaderBoardButton].forEach(element => {
        element.className = "navButtons"
    });

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
    const LOBBYLIST = await fb_read("/lobbies");
    lobbyTable.innerHTML = "";
    if (LOBBYLIST == null) {
        let noLobbies = document.createElement("p");
        noLobbies.innerHTML = "Waiting for lobbies..."
        noLobbies.style.fontStyle = 'italic';
        noLobbies.style.fontSize = '5vw';
        noLobbies.style.color = 'gray';
        lobbyTable.appendChild(noLobbies)
        return;
    }
    const LOBBYLISTKEYS = Object.keys(LOBBYLIST)
    for (let i = 0; i < LOBBYLISTKEYS.length; i++) {
        if (LOBBYLIST[LOBBYLISTKEYS[i]].players.length >= 2) continue;
        let tableRow = document.createElement("tr");
        let lobbyName = document.createElement("td");
        let joinButton = document.createElement("button");
        lobbyName.innerHTML = LOBBYLIST[LOBBYLISTKEYS[i]].name;
        joinButton.innerHTML = "Join";
        joinButton.onclick = () => { joinLobby(LOBBYLISTKEYS[i]) };
        joinButton.className = "joinButtons"
        tableRow.append(lobbyName, joinButton);
        tableRow.className = 'lobbyTb'
        lobbyTable.appendChild(tableRow);
    }
}

/** 
 * find a unique name for the lobby
 * set up lobby information in firebase '/lobbies/'
 * then wait for a player to join
 */
async function hostLobby() {
    username = await fb_read(`/userDetails/${sessionStorage.getItem("uid")}/public/username`);
    document.body.removeChild(lobby_di);
    let lobbyList = await fb_read("/lobbies");
    let lobbyNumber;
    if (lobbyList != null) { lobbyNumber = Object.keys(lobbyList).length + 1; }
    else { lobbyNumber = 1; }
    lobbyNumber.toString();
    let lobbyData = {
        name: `${username}'s lobby`,
        players: [await getPlayerData()],
        board: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
    };
    await fb_write(lobbyData, `/lobbies/${lobbyNumber}`);
    waitForPlayer(lobbyNumber);
}

/**
 * will wait until a player joins then will decide a starting player
 * starting player will have cross as their symbol
 * turn is stored as the uid of the player whose turn it is
 * @param {string} lobbyNumber
 * @returns {void}
 */
async function waitForPlayer(lobbyNumber) {
    //create waiting display
    let wait_di = document.createElement('div')
    let back_bt = document.createElement('button')
    let wait_h2 = document.createElement('h2')
    back_bt.innerText = 'Back'
    wait_h2.innerText = `Waiting for a player to join\nlobby: ${username}'s lobby`
    wait_h2.className = 'centered'
    back_bt.onclick = async () => {
        back_bt.remove()
        back_bt = undefined
        wait_h2.remove()
        await fb_remove(`/lobbies/${lobbyNumber}`)
        startLobbyScreen()
        return
    }
    wait_di.className = 'centered'
    wait_di.append(wait_h2, back_bt)
    document.body.append(wait_di)
    //start waiting for another player to join
    fb_removeOnDisconnect(`/lobbies/${lobbyNumber}`)
    await fb_waitForChange(`/lobbies/${lobbyNumber}/players`);
    if (back_bt == undefined) return; //this is incase back_bt was pressed
    back_bt.remove()
    wait_h2.remove()
    let startingPlayer = Math.floor(Math.random() * 2);
    let players = await fb_read(`/lobbies/${lobbyNumber}/players`);
    let turn = players[startingPlayer].uid;
    //set starting player symbol
    await fb_write("cross", `/lobbies/${lobbyNumber}/players/${startingPlayer}/symbol`);
    //set last player symbol
    await fb_write("nought", `/lobbies/${lobbyNumber}/players/${Math.abs(startingPlayer - 1)}/symbol`);
    await fb_write(turn, `/lobbies/${lobbyNumber}/turn`);

    startGame(lobbyNumber);
}

/**
 * the player joining a lobby will be the last, it will start the game
 * @returns {void}
 */
async function joinLobby(lobbyNumber) {
    await fb_write(await getPlayerData(), `/lobbies/${lobbyNumber}/players/1`);
    document.body.removeChild(lobby_di);
    startGame(lobbyNumber);
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
function startGame(lobbyNumber) {
    sessionStorage.setItem("lobbyNumber", lobbyNumber);
    ttt_startGame()
}

/**
 * used when leaderBoardButton is pressed, size is the amount of players scores displayed
 * will make a modal div visible and populate it with data
 */
async function displayLeaderBoard(size) {
    //blur background, the div happens to be centered class
    document.querySelectorAll('.centered').forEach(element => {
        element.classList.add('blured')
    });
    document.getElementById('leaderBoardContent_tb').innerHTML = ''
    let scores = await fb_readSorted("/games/TTT/MMR", "MMR", size)
    //create table row for each players top scores, containing their username and score
    if (scores == null) { console.log('scores == null'); return };
    for (let i = 0; i < scores.length; i++) {
        let entry = document.createElement('tr')
        let name = document.createElement('td')
        let score = document.createElement('td')
        let ranking = document.createElement('td')
        ranking.innerHTML = i + 1
        name.innerHTML = scores[i].username
        score.innerHTML = int(scores[i].MMR)
        ranking.className = "leaderBoardContent"
        name.className = "leaderBoardContent"
        score.className = "leaderBoardContent"
        entry.append(ranking, name, score)
        document.getElementById('leaderBoardContent_tb').append(entry)
    }
    document.getElementById('leaderBoard_di').style.display = 'block'
}

//used to hide leaderboard
window.onclick = function (event) {
    if (event.target == document.getElementById('leaderBoard_di')) {
        document.getElementById('leaderBoard_di').style.display = "none";
        document.querySelectorAll('.centered').forEach(element => {
            element.classList.remove('blured')
        });
    }
}