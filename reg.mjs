import {fb_write} 
    from "./FireBase/fb_io.mjs";

async function submit(){
    //console.log("submit")
    let result = sessionStorage.getItem("googleAuth")
    console.log(result)
    /*
    let userDetails = {
        address:document.getElementById("addressInput").value,
        phone:document.getElementById("phoneInput").value,
        age:document.getElementById("ageInput").value,
        username:document.getElementById("usernameInput").value,
        uid:result.user.uid,
        email:result.user.email,
        photoURL:result.user.photoURL,
        displayName:result.user.displayName
    }
    print(userDetails)
    //await fb_write(address, sessionStorage.getItem("uid"))*/
}

window.submit = submit