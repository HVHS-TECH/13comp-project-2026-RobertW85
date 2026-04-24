//Term 1 2026
import { fb_read, fb_initialize, fb_write, fb_remove } from "../FireBase/fb_io.mjs"

fb_initialize()

window.userButton = userButton
window.rgButton = rgButton
window.tttButton = tttButton

function userButton() {
    fillTable("/userDetails")
}

function rgButton() {
    fillTable("/Games/Rogue/Scores")
}

function tttButton() {
    //fillTable("/userDetails")
}

async function fillTable(path) {
    document.getElementsByTagName("table")[0].innerHTML = ''
    let data = await fb_read(path)
    for (let i = 0; i < Object.keys(data).length; i++) {
        let tr = document.createElement("tr")
        let userInfo = data[Object.keys(data)[i]]
        for (let j = 0; j < Object.keys(userInfo).length; j++) {
            //console.log("key: ", Object.keys(userInfo)[j])
            //console.log("value: ", userInfo[Object.keys(userInfo)[j]])
            let key_TD = document.createElement("td")
            let value_IN = document.createElement("input")
            key_TD.innerHTML = Object.keys(userInfo)[j]
            value_IN.value = userInfo[Object.keys(userInfo)[j]]
            value_IN.id = key_TD.innerHTML
            tr.append(key_TD, value_IN)
            value_IN.addEventListener("change", function (e) {
                //console.log(`path:${Object.keys(data)[i]} key:${this.id} value:${e.target.value}`)
                console.log(this)
                fb_write(e.target.value, `${path}/${Object.keys(data)[i]}/${this.id}`)
            })
        }
        let remove_BT = document.createElement("button")
        tr.appendChild(remove_BT)
        remove_BT.textContent = "DELETE"
        remove_BT.addEventListener("click", function () {
            fb_remove(`${path}/${Object.keys(data)[i]}`);
            this.parentElement.remove()
        })
        document.getElementsByTagName("table")[0].appendChild(tr)
    }
}