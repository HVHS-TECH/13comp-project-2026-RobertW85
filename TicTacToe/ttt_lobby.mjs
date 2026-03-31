import {
    fb_initialize,
    fb_read,
    fb_write,
    fb_onValue,
} from "../FireBase/fb_io.mjs";
import {
    ttt_startGame
} from "./ttt_game.mjs";

let lobbyTable, lobbyDiv;

fb_initialize();
let uid = sessionStorage.getItem("uid");
startup();

function startup() {
    startLobbyScreen();
}

export function startLobbyScreen() {
    console.log("start up lobby");
    lobbyDiv = document.createElement("div");
    let lobbyTitle = document.createElement("h1");
    lobbyTable = document.createElement("table");
    let buttonDiv = document.createElement("div");
    let hostButton = document.createElement("button");
    let refreshButton = document.createElement("button");

    document.body.appendChild(lobbyDiv);
    lobbyDiv.appendChild(lobbyTitle);
    lobbyDiv.appendChild(buttonDiv);
    buttonDiv.appendChild(hostButton);
    buttonDiv.appendChild(refreshButton);
    lobbyDiv.appendChild(lobbyTable);

    hostButton.innerHTML = "Host";
    hostButton.onclick = hostLobby;
    refreshButton.innerHTML = "refresh";
    refreshButton.onclick = refreshAvalibleLobbies;
    lobbyTitle.innerHTML = "Tic tac toe Lobby";

    refreshAvalibleLobbies();
}

async function refreshAvalibleLobbies() {
    lobbyTable.innerHTML = "";

    let lobbyList = await fb_read("/lobbies");
    if (lobbyList == null) {
        return;
    }
    for (let i = 0; i < Object.keys(lobbyList).length; i++) {
        if (lobbyList[Object.keys(lobbyList)[i]].players.length >= 2) {
            continue;
        }

        let tableRow = document.createElement("tr");
        let lobbyName = document.createElement("td");
        let joinButton = document.createElement("button");

        lobbyName.innerHTML = Object.keys(lobbyList)[i];

        joinButton.innerHTML = "Join";
        joinButton.onclick = () => {joinLobby(lobbyName.innerHTML);};

        tableRow.appendChild(lobbyName);
        tableRow.appendChild(joinButton);
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
    await fb_write(
        "cross",
        `/lobbies/${lobbyName}/players/${startingPlayer}/symbol`,
    );
    //set last player symbol
    await fb_write(
        "nought",
        `/lobbies/${lobbyName}/players/${Math.abs(startingPlayer - 1)}/symbol`,
    );
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
        userName: await fb_read(
            `/userDetails/${sessionStorage.getItem("uid")}/username`,
        ),
    };
    return playerData;
}

function startGame(lobbyName) {
    console.log("starting game")
    sessionStorage.setItem("lobbyName", lobbyName);
    ttt_startGame()
}
