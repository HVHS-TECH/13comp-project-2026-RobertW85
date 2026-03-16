import {
  fb_initialize,
  fb_read,
  fb_write,
  fb_onValue,
} from "../FireBase/fb_io.mjs";

let lobbyDiv = document.createElement("div");
let lobbyTitle = document.createElement("h1");
let lobbyTable = document.createElement("table");

let lobbyData = {
  lobbyName: null,
  players: null,
  turn: null,
  bord: null,
};

fb_initialize();
let uid = sessionStorage.getItem("uid");
startup();

function startup() {
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
    joinButton.onclick = () => {
      joinLobby(lobbyName.innerHTML);
    };

    tableRow.appendChild(lobbyName);
    tableRow.appendChild(joinButton);
    lobbyTable.appendChild(tableRow);
  }
}

async function hostLobby() {
  let lobbyList = await fb_read("/lobbies");
  let lobbyNumber;
  if (lobbyList != null) {
    lobbyNumber = Object.keys(lobbyList).length + 1;
  } else {
    lobbyNumber = 1;
  }

  lobbyData.lobbyName = "Lobby" + lobbyNumber;
  lobbyData.players = [await getPlayerData()];
  lobbyData.turn = null;
  lobbyData.bord = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  let lobbyName = "lobby" + lobbyNumber;
  await fb_write(lobbyData, `/lobbies/${lobbyName}`);

  waitForPlayer(lobbyName);
}

async function waitForPlayer(lobbyName) {
  const PATH = `/lobbies/${lobbyName}/players`;
  await fb_onValue(PATH)

  let players = await fb_read(PATH);
  console.log(players);
  let turn = players[Math.floor(Math.random() * 2)].uid;
  console.log(turn)
  await fb_write(turn, `/lobbies/${lobbyName}/turn`);
  startGame(lobbyName);
}

async function joinLobby(lobbyName) {
  console.log(lobbyName);
  //since its two player joinng a non full lobby will make you the second player
  await fb_write(await getPlayerData(), `/lobbies/${lobbyName}/players/1`);
  startGame(lobbyName);
}

async function getPlayerData(){
  let playerData = {
    uid:uid,
    userName:await fb_read("/userDetails/" + sessionStorage.getItem("uid") + "/username")
  }
  return playerData
}

function startGame(lobbyName) {
  sessionStorage.setItem("lobbyName", lobbyName);
  document.body.removeChild(lobbyDiv);
  let game = document.createElement("script");
  game.type = "module";
  game.src = "ttt_game.mjs";
  document.body.appendChild(game);
}
