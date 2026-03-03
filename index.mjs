//2026 t1
import {fb_authenticate, fb_initialize, fb_read, userDetails}
    from "/FireBase/fb_io.mjs";

fb_initialize()

async function signIn(){
    let result = await fb_authenticate()
    console.log(result)
    console.log(result.user.uid)
    /*sessionStorage.setItem("googleAuth", result);
    if (await fb_read('/userDetails/' + result.user.uid) == null){
        window.location.href = 'reg.html'
    }*/
}

window.signIn = signIn;