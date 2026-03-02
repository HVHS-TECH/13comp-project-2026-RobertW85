//2026 t1
import {fb_authenticate, fb_initialize, fb_read, userDetails}
    from "/FireBase/fb_io.mjs";

fb_initialize()

async function signIn(){
    await fb_authenticate()
    //console.log(userDetails)
    sessionStorage.setItem("uid", userDetails.uid);
    //console.log(await fb_read('/userDetails/' + sessionStorage.getItem("uid")))
    if (await fb_read('/userDetails/' + sessionStorage.getItem("uid")) == null){
        window.location.href = 'reg.html'
    }
}

window.signIn = signIn;