import {fb_authenticate, fb_initialize}
    from "/FireBase/fb_io.mjs";

fb_initialize()

function signIn(){
    fb_authenticate()
}

window.signIn = signIn;