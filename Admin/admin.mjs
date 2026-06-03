//Term 1 2026
import { fb_read, fb_initialize, fb_write, fb_remove } from "../FireBase/fb_io.mjs"
fb_initialize()

window.userButton = userButton
window.rgButton = rgButton
window.tttButton = tttButton

function userButton() { fillTable("/userDetails") }
function rgButton() { fillTable("/games/rogue/scores") }
function tttButton() { fillTable("/games/TTT/MMR") }

async function fillTable(path, table) {
    if (!table) {
        table = document.getElementById('mainAdminTable')
        table.innerHTML = ''
    }


    let data = await fb_read(path)
    if (data == null) { table.style.display = 'none'; return }
    table.style.display = 'block'

    for (let i = 0; i < Object.keys(data).length; i++) {
        // Create table row with name of path
        let tr = document.createElement("tr")
        let pathName = document.createElement("p")
        pathName.innerText = `${Object.keys(data)[i]}`
        tr.append(pathName)

        let info = data[Object.keys(data)[i]]
        if (typeof info !== 'object') {
            //hard coded for users public/private and is rather sketchy (no key instead using tr?)
            //console.log(info)
            interperateKeyValuePair("", info, tr);
            table.appendChild(tr)
        } else {
            //create for each path inside the path 
            //if the path is a key value pair create a input with the value and a p with the key
            //if the path is an object that leads to more key value pairs create a button which runs this function again
            for (let j = 0; j < Object.keys(info).length; j++) {
                //if row contains expandable object
                if (typeof (info[Object.keys(info)[j]]) == 'object') {
                    let innerObject_bt = document.createElement("button")
                    innerObject_bt.textContent = `${Object.keys(info)[j]}`
                    innerObject_bt.onclick = () => {
                        let innerPath = `${path}/${Object.keys(data)[i]}/${Object.keys(info)[j]}`
                        let innerTable = document.createElement('table')
                        innerTable.id = `${path}/${Object.keys(data)[i]}/${Object.keys(info)[j]}`
                        if (document.getElementById(innerTable.id) != null) { document.getElementById(innerTable.id).remove() }
                        //add a button to collapse
                        let collapse_bt = document.createElement("image")
                        //icon is a image from google icons (https://fonts.google.com/icons)
                        collapse_bt.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="10px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>'
                        collapse_bt.onclick = () => {
                            document.getElementById(innerTable.id).remove()
                            collapse_bt.remove()
                        }
                        tr.append(collapse_bt)
                        tr.append(innerTable)
                        fillTable(innerPath, innerTable)
                    };
                    tr.append(innerObject_bt)
                    continue
                }
                interperateKeyValuePair(Object.keys(info)[j], info[Object.keys(info)[j]], tr)
            }
        }
        //add a button to each entry allowing for firebase deletion
        let remove_bt = document.createElement("button")
        tr.appendChild(remove_bt)
        remove_bt.textContent = "DELETE"
        remove_bt.addEventListener("click", function () {
            fb_remove(`${path}/${Object.keys(data)[i]}`);
            this.parentElement.remove()
        })
        table.appendChild(tr)
    }
}

function interperateKeyValuePair(key, value, tr) {
    //create value and key combo allowing for value to be edited
    let key_td = document.createElement("td")
    let value_in = document.createElement("input")
    let type_sl = document.createElement("select")
    key_td.innerHTML = key
    value_in.value = value
    value_in.id = key_td.innerHTML
    //allow the type stored to be changed
    //should change the defualt selected to match the existing type in the future
    //original type: typeof info[Object.keys(info)[j]]
    let string_op = document.createElement("option")
    string_op.value = "string"
    string_op.innerHTML = "string"
    let int_op = document.createElement("option")
    int_op.value = "int"
    int_op.innerHTML = "int"
    type_sl.append(string_op, int_op)
    type_sl.id = `${key_td.innerHTML}_sl`
    tr.append(key_td, value_in, type_sl)
    //allow the value to be edited in fire base following the selected type
    value_in.addEventListener("change", function (e) {
        let valueType = document.getElementById(`${this.id}_sl`).value
        let value = e.target.value
        if (valueType == 'int') {
            value = parseInt(value)
            if (isNaN(value)) { console.log("is nan"); return }
        }
        fb_write(value, `${path}/${Object.keys(data)[i]}/${this.id}`)
    })
}