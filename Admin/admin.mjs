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
    fillTable("/Games/TTT/MMR")
}

async function fillTable(path) {
    document.getElementsByTagName("table")[0].innerHTML = ''
    let data = await fb_read(path)
    if (data == null) { return }

    for (let i = 0; i < Object.keys(data).length; i++) {
        let tr = document.createElement("tr")
        let Info = data[Object.keys(data)[i]]
        if (typeof Info === 'object') {
            for (let j = 0; j < Object.keys(Info).length; j++) {
                //console.log("key: ", Object.keys(Info)[j])
                //console.log("value: ", Info[Object.keys(Info)[j]])
                let key_TD = document.createElement("td")
                let value_IN = document.createElement("input")
                let type_SL = document.createElement("select")
                key_TD.innerHTML = Object.keys(Info)[j]
                value_IN.value = Info[Object.keys(Info)[j]]
                value_IN.id = key_TD.innerHTML

                //type options:
                //original type: typeof Info[Object.keys(Info)[j]]
                let string_OP = document.createElement("option")
                string_OP.value = "string"
                string_OP.innerHTML = "string"
                let int_OP = document.createElement("option")
                int_OP.value = "int"
                int_OP.innerHTML = "int"
                type_SL.append(string_OP, int_OP)
                type_SL.id = `${key_TD.innerHTML}_sl`

                tr.append(key_TD, value_IN, type_SL)
                value_IN.addEventListener("change", function (e) {
                    let valueType = document.getElementById(`${this.id}_sl`).value
                    //console.log(`path:${Object.keys(data)[i]} key:${this.id} value:${e.target.value}`)
                    let value = e.target.value
                    if (valueType == 'int') {
                        value = parseInt(value)
                        if (isNaN(value)) { console.log("is nan"); return }
                    }
                    fb_write(value, `${path}/${Object.keys(data)[i]}/${this.id}`)
                })
            }
        } else { //should simplify the if else since its mostly the same
            console.log(Object.entries(data)[i])
            let key_TD = document.createElement("td")
            let value_IN = document.createElement("input")
            key_TD.innerHTML = Object.entries(data)[i][0]
            value_IN.value = Object.entries(data)[i][1]
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