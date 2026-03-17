//2026 t1
import { fb_authenticate, fb_initialize, fb_read } from "./FireBase/fb_io.mjs";

fb_initialize();
if (sessionStorage.getItem("uid") != null) {
  if (
    (await fb_read("/userDetails/" + sessionStorage.getItem("uid"))) != null
  ) {
    login();
  }
}
async function signIn() {
  let result = await fb_authenticate();
  //console.log(result)
  sessionStorage.setItem("uid", result.user.uid);
  sessionStorage.setItem("email", result.user.email);
  sessionStorage.setItem("photoURL", result.user.photoURL);
  sessionStorage.setItem("displayName", result.user.displayName);
  if ((await fb_read("/userDetails/" + result.user.uid)) == null) {
    window.location.href = "reg.html";
  } else {
    login();
  }
}

function login() {
  //console.log("login")
  document.getElementById("blockerDiv").remove();
  for (
    let i = 0;
    i < document.getElementsByClassName("gameButton").length;
    i++
  ) {
    document.getElementsByClassName("gameButton")[i].disabled = false;
  }
}

window.signIn = signIn;
