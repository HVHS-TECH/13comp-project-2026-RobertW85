import {fb_initialize, fb_read, fb_write}
    from '/fireBase/fb_io.mjs'

let lobbyDiv = document.createElement('div')
let lobbyTitle = document.createElement('h1')
let lobbyTable = document.createElement('table')
let buttonDiv = document.createElement('div')
let hostButton = document.createElement('button')

let lobbyData = {
    lobbyName:null,
    player1:null,
    player2:null,
    turn:null,
    bord:null,
}

fb_initialize()
startup()

function startup() {
    document.body.appendChild(lobbyDiv)
    lobbyDiv.appendChild(lobbyTitle)
    lobbyDiv.appendChild(buttonDiv)
    lobbyDiv.appendChild(hostButton)
    lobbyDiv.appendChild(lobbyTable)
    

    hostButton.innerHTML = 'Host'
    hostButton.onclick = hostLobby
    lobbyTitle.innerHTML = 'Tic tac toe Lobby'

    refreshAvalibleLobbies()
}

async function refreshAvalibleLobbies(){
    let lobbyList = await fb_read('/lobbies')
    for (let i = 0; i < Object.keys(lobbyList).length; i++){
        let tableRow = document.createElement('tr')
        let lobbyName = document.createElement('td')
        let joinButton = document.createElement('button')

        lobbyName.innerHTML = Object.keys(lobbyList)[i]
        joinButton.innerHTML = 'Join'

        tableRow.appendChild(lobbyName)
        tableRow.appendChild(joinButton)
        lobbyTable.appendChild(tableRow)

    }
}

async function hostLobby(){
    let lobbyList = await fb_read('/lobbies')
    let lobbyNumber = Object.keys(lobbyList).length + 1
    lobbyData.lobbyName = 'Lobby' + lobbyNumber
    lobbyData.player1 = await fb_read('/userDetails/' + sessionStorage.getItem("uid") + "/username")
    lobbyData.player2 = ""
    lobbyData.turn = 0
    lobbyData.bord = [[0,0,0],[0,0,0],[0,0,0]]
    fb_write(lobbyData,'/lobbies/lobby'+lobbyNumber)
}