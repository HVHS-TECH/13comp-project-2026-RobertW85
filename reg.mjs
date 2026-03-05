import {fb_write, fb_initialize, fb_read} 
    from "./FireBase/fb_io.mjs";
fb_initialize()
async function submit(){
    let userDetails = {
        address:document.getElementById("addressInput").value,
        phone:document.getElementById("phoneInput").value,
        age:document.getElementById("ageInput").value,
        username:document.getElementById("usernameInput").value,
        uid:sessionStorage.getItem("uid"),
        email:sessionStorage.getItem("email"),
        photoURL:sessionStorage.getItem("photoURL"),
        displayName:sessionStorage.getItem("displayName")
    }
    await fb_write(userDetails, '/userDetails/'+userDetails.uid)
    window.location.href = 'index.html'
}

window.submit = submit