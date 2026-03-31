//Term 1 2026

import{fb_read, fb_initialize} from "../FireBase/fb_io.mjs"

fb_initialize()

window.userButton = userButton
window.rgButton = rgButton
window.tttButton = tttButton

function userButton(){
    fillTable("/userDetails")
}

function rgButton(){
    fillTable("/Games/Rogue/Scores/")
}

function tttButton(){
    //fillTable("/userDetails")
}

async function fillTable (path){
    let data = await fb_read(path)
    //console.log(data)
    for (let i = 0; i < Object.keys(data).length; i++){
        let tr = document.createElement("tr")
        console.log(data[Object.keys(data)[i]])
        //console.log(Object.keys(data[Object.keys(data)[i]]))
        //for (let j = 0; j < data[Object.keys(data)[i]].length; j++){
        //    console.log(Object.keys(data[Object.keys(data)[i]])[j])
        //}


        //for (let j = 0; j < Object.keys(Object.keys(data)[i]).length; i++)
        //    console.log(Object.keys(Object.keys(path)[i])[j])
    }
}