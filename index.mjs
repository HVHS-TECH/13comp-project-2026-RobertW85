//2026 t1
import { fb_authenticate, fb_initialize, fb_waitForChange, fb_read } from "./FireBase/fb_io.mjs";

fb_initialize();
if (sessionStorage.getItem("signedIn") == null) {
  document.getElementById('signIn_bt').style.display = 'block'
} else {
  login(sessionStorage.getItem("uid"));
}

async function signIn() {
  let result = await fb_authenticate();
  //console.log(result)
  sessionStorage.setItem("uid", result.user.uid);
  sessionStorage.setItem("email", result.user.email);
  sessionStorage.setItem("photoURL", result.user.photoURL);
  sessionStorage.setItem("displayName", result.user.displayName);
  if (await fb_read("/userDetails/" + result.user.uid) == null) {
    //window.location.href = "reg.html";
    if (document.getElementById('reg_sc') == null) {
      let reg_sc = document.createElement('script')
      reg_sc.src = "reg.mjs"
      reg_sc.type = "module"
      reg_sc.id = 'reg_sc'
      document.body.appendChild(reg_sc)
    }
    document.getElementById('registration_di').style.display = 'block'
  } else {
    login(result.user.uid);
  }
}

export async function login(uid) {
  sessionStorage.setItem("signedIn", "true")
  if (sessionStorage.getItem("admin") == null) {
    (await fb_read(`/admin/${uid}`) == null) ? sessionStorage.setItem("admin", "false") : activateAdmin();
  }
  else if (sessionStorage.getItem("admin") == "true") activateAdmin();

  document.getElementById('signIn_bt').remove();
  for (let i = 0; i < document.getElementsByClassName("gameButton").length; i++) {
    document.getElementsByClassName("gameButton")[i].style.display = 'inline';
    document.getElementsByClassName("gameButton")[i].disabled = false;
  }
}

function activateAdmin() {
  sessionStorage.setItem("admin", "true")
  console.log("admin")
  let admin_bt = document.createElement("button");
  admin_bt.id = 'admin_bt';
  admin_bt.innerHTML = 'Admin';
  admin_bt.onclick = () => { window.location.href = "/Admin/admin.html" };
  document.getElementById('buttons_di').appendChild(admin_bt);
}

window.signIn = signIn;
