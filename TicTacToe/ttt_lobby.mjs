import { fb_initialize,fb_read,fb_write,fb_onValue } from "../FireBase/fb_io.mjs";
import { ttt_startGame } from "./ttt_game.mjs";

let lobbyTable, lobbyDiv;

fb_initialize();
let uid = sessionStorage.getItem("uid");
startLobbyScreen();

export function startLobbyScreen() {
    console.log("start up lobby");
    lobbyDiv = document.createElement("div");
    lobbyTable = document.createElement("table");
    let lobbyTitle = document.createElement("h1");
    let buttonDiv = document.createElement("div");
    let hostButton = document.createElement("button");
    let refreshButton = document.createElement("button");
    let backButton = document.createElement("button");

    document.body.appendChild(lobbyDiv);
    buttonDiv.append(backButton, hostButton,refreshButton);
    lobbyDiv.append(lobbyTitle,buttonDiv,lobbyTable);
    
    backButton.innerHTML = "Back";
    backButton.onclick = () => {history.back()};
    hostButton.innerHTML = "Host";
    hostButton.onclick = hostLobby;
    refreshButton.innerHTML = "refresh";
    refreshButton.onclick = refreshAvailableLobbies;
    lobbyTitle.innerHTML = "Tic tac toe Lobby";

    refreshAvailableLobbies();
}

async function refreshAvailableLobbies() {
    lobbyTable.innerHTML = "";

    const LOBBYLIST = await fb_read("/lobbies");
    if (LOBBYLIST == null) {
        return;
    }
    const LOBBYLISTKEYS = Object.keys(LOBBYLIST)
    for (let i = 0; i < LOBBYLISTKEYS.length; i++) {
        if (LOBBYLIST[LOBBYLISTKEYS[i]].players.length >= 2) {
            continue;
        }

        let tableRow = document.createElement("tr");
        let lobbyName = document.createElement("td");
        let joinButton = document.createElement("button");

        lobbyName.innerHTML = LOBBYLISTKEYS[i];

        joinButton.innerHTML = "Join";
        joinButton.onclick = () => {joinLobby(lobbyName.innerHTML)};

        tableRow.append(lobbyName,joinButton);
        lobbyTable.appendChild(tableRow);
    }
}

async function hostLobby() {
    console.log("creating lobby");
    document.body.removeChild(lobbyDiv);
    let lobbyList = await fb_read("/lobbies");
    let lobbyNumber;
    if (lobbyList != null) {
        lobbyNumber = Object.keys(lobbyList).length + 1;
    } else {
        lobbyNumber = 1;
    }
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

async function waitForPlayer(lobbyName) {
    //console.log("waiting for players");
    await fb_onValue(`/lobbies/${lobbyName}/players`);
    console.log("player joined lobby")
    let startingPlayer = Math.floor(Math.random() * 2);
    let players = await fb_read(`/lobbies/${lobbyName}/players`);
    let turn = players[startingPlayer].uid;
    //console.log(`Current turn:${turn}`);
    //set starting player symbol
    await fb_write("cross",`/lobbies/${lobbyName}/players/${startingPlayer}/symbol`);
    //set last player symbol
    await fb_write("nought",`/lobbies/${lobbyName}/players/${Math.abs(startingPlayer - 1)}/symbol`);
    await fb_write(turn, `/lobbies/${lobbyName}/turn`);
    startGame(lobbyName);
}

async function joinLobby(lobbyName) {
    await fb_write(await getPlayerData(), `/lobbies/${lobbyName}/players/1`);
    document.body.removeChild(lobbyDiv);
    startGame(lobbyName);
}

async function getPlayerData() {
    let playerData = {
        uid: uid,
        userName: await fb_read(`/userDetails/${sessionStorage.getItem("uid")}/username`)
    };
    return playerData;
}

function startGame(lobbyName) {
    console.log("starting game")
    sessionStorage.setItem("lobbyName", lobbyName);
    ttt_startGame()
}
