//Term 1 2026
import { fb_read, fb_initialize, fb_write, fb_remove } from "../FireBase/fb_io.mjs"
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
fb_initialize()
getAuth() //need for fb_rules???

window.userButton = userButton
window.rgButton = rgButton
window.tttButton = tttButton

function userButton() { fillTable("/userDetails") }
function rgButton() { fillTable("/Games/Rogue/Scores") }
function tttButton() { fillTable("/Games/TTT/MMR") }


async function fillTable(path) {
    document.getElementsByTagName("table")[0].innerHTML = ''
    let data = await fb_read(path)
    if (data == null) { return }
    for (let i = 0; i < Object.keys(data).length; i++) {
        let tr = document.createElement("tr")
        let pathName = document.createElement("p")
        pathName.innerText = `${Object.keys(data)[i]}`
        tr.append(pathName)
        let Info = data[Object.keys(data)[i]]
        if (typeof Info !== 'object') { return }
        for (let j = 0; j < Object.keys(Info).length; j++) {
            if (typeof(Info[Object.keys(Info)[j]]) == 'object'){ //instead of this maybe run this outside of for loop/table instead use class to remove
                let innerObject_bt = document.createElement("button")
                innerObject_bt.textContent = `${Object.keys(Info)[j]}`
                innerObject_bt.onclick = () => {
                    let innerPath = `${path}/${Object.keys(data)[i]}/${Object.keys(Info)[j]}`
                    fillTable(innerPath)
                };

                tr.append(innerObject_bt)
                continue
            }
            //console.log("key: ", Object.keys(Info)[j])
            //console.log("value: ", Info[Object.keys(Info)[j]])
            let key_td = document.createElement("td")
            let value_in = document.createElement("input")
            let type_sl = document.createElement("select")
            key_td.innerHTML = Object.keys(Info)[j]
            value_in.value = Info[Object.keys(Info)[j]]
            value_in.id = key_td.innerHTML

            //type options:
            //original type: typeof Info[Object.keys(Info)[j]]
            let string_op = document.createElement("option")
            string_op.value = "string"
            string_op.innerHTML = "string"
            let int_op = document.createElement("option")
            int_op.value = "int"
            int_op.innerHTML = "int"
            type_sl.append(string_op, int_op)
            type_sl.id = `${key_td.innerHTML}_sl`

            tr.append(key_td, value_in, type_sl)
            value_in.addEventListener("change", function (e) {
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
        let remove_bt = document.createElement("button")
        tr.appendChild(remove_bt)
        remove_bt.textContent = "DELETE"
        remove_bt.addEventListener("click", function () {
            fb_remove(`${path}/${Object.keys(data)[i]}`);
            this.parentElement.remove()
        })
        document.getElementsByTagName("table")[0].appendChild(tr)
    }
}