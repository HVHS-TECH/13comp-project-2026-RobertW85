import {
  fb_initialize,
  fb_read,
  fb_write,
  fb_onValue,
} from "/fireBase/fb_io.mjs";

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
let userName = await fb_read(
  "/userDetails/" + sessionStorage.getItem("uid") + "/username",
);
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
    //let lobbyPlayers = document.createElement('td')
    let joinButton = document.createElement("button");

    lobbyName.innerHTML = Object.keys(lobbyList)[i];

    /* no need to display lobby players as 0 player lobbies will not exist and 2 player lobbies are not joinable
        console.log(lobbyList[Object.keys(lobbyList)[i]])
        if (lobbyList[Object.keys(lobbyList)[i]].player1 != ""){
            if (lobbyList[Object.keys(lobbyList)[i]].player2 != ""){
                lobbyPlayers.innerHTML = "2/2"
            }
            else{
                lobbyPlayers.innerHTML = "1/2"
            }
        }*/

    //lobbyPlayers.innerHTML =
    joinButton.innerHTML = "Join";
    joinButton.onclick = () => {
      joinLobby(lobbyName.innerHTML);
    };

    tableRow.appendChild(lobbyName);
    //tableRow.appendChild(lobbyPlayers)
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
  lobbyData.players = [userName];
  lobbyData.turn = 0;
  lobbyData.bord = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  let lobbyName = "lobby" + lobbyNumber;
  fb_write(lobbyData, "/lobbies/" + lobbyName);

  //when player joins
  waitForPlayer(lobbyName);
}

function waitForPlayer(lobbyName) {
  const PATH = `/lobbies/${lobbyName}/players`;
  fb_onValue(PATH);
}

async function joinLobby(lobbyName) {
  console.log(lobbyName);
  //let players = []
  //players.push(await fb_read('/lobbies/'+lobbyName+'/players'))
  //console.log(players)
  //since its two player joinng a non full lobby will make you the second player
  await fb_write(userName, "/lobbies/" + lobbyName + "/players/1");

  //tell host to start game

  document.body.removeChild(lobbyDiv);
  let game = document.createElement("script");
  game.src = "ttt_game.js";
  document.body.appendChild(game);
}
