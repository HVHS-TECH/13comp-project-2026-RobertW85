//2026 t1
import { fb_authenticate, fb_initialize, fb_onValue, fb_read } from "./FireBase/fb_io.mjs";

fb_initialize();
if (sessionStorage.getItem("uid") != null) {
  if (await fb_read(`/userDetails/${sessionStorage.getItem("uid")}`) != null) {
    login(sessionStorage.getItem("uid"));
  }
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
    while (true) {
      console.log("test")
      await fb_onValue(`/userDetails/`);
      const READ = await fb_read(`/userDetails/${sessionStorage.getItem("uid")}`)
      if (READ != null) {
        break
      }
    }
    login(result.user.uid)
  } else {
    login(result.user.uid);
  }
}

async function login(uid) {
  if (await fb_read(`/admin/${uid}`) != null) {
    console.log("admin")
    let admin_bt = document.createElement("button");
    admin_bt.id = 'admin_bt';
    admin_bt.innerHTML = 'Admin';
    admin_bt.onclick = () => { window.location.href = "/Admin/admin.html" };
    document.body.appendChild(admin_bt);
  }
  document.getElementById('signIn_bt').remove();
  for (let i = 0; i < document.getElementsByClassName("gameButton").length; i++) {
    document.getElementsByClassName("gameButton")[i].style.display = 'inline';
    document.getElementsByClassName("gameButton")[i].disabled = false;
  }
}

window.signIn = signIn;
