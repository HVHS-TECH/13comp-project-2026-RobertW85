//Term 1 2026

import { fb_read, fb_initialize } from "../FireBase/fb_io.mjs"

fb_initialize()

window.userButton = userButton
window.rgButton = rgButton
window.tttButton = tttButton

function userButton() {
    fillTable("/userDetails")
}

function rgButton() {
    fillTable("/Games/Rogue/Scores/")
}

function tttButton() {
    //fillTable("/userDetails")
}

async function fillTable(path) {
    let data = await fb_read(path)
    //console.log(data)
    for (let i = 0; i < Object.keys(data).length; i++) {
        let tr = document.createElement("tr")
        let userInfo = data[Object.keys(data)[i]]
        for (let j = 0; j < Object.keys(userInfo).length; j++) {
            //console.log("key: ", Object.keys(userInfo)[j])
            //console.log("value: ", userInfo[Object.keys(userInfo)[j]])
            let key_TD = document.createElement("td")
            let value_TD = document.createElement("input")
            key_TD.innerHTML = Object.keys(userInfo)[j]
            value_TD.value = userInfo[Object.keys(userInfo)[j]]
            tr.appendChild(key_TD)
            tr.appendChild(value_TD)
        }
        document.body.appendChild(tr)
    }
}