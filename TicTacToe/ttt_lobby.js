let lobbyDiv = document.createElement("div")
let lobbyTitle = document.createElement("h1")

function startup() {
    document.body.appendChild(lobbyDiv)
    lobbyDiv.appendChild(lobbyTitle)
    lobbyTitle.innerHTML  = "Title"
}