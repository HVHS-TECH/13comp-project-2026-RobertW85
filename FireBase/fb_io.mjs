//**************************************************************/
// fb_io.mjs
// Generalised firebase routines
// Written by Robert, Term 1 2026
//
// All variables & function begin with fb_  all const with FB_
// Diagnostic code lines have a comment appended to them //DIAG
/**************************************************************/
const COL_C = "white"; // These two const are part of the coloured
const COL_B = "#CD7F32"; // console.log for functions scheme
console.log("%c fb_io.mjs", "color: blue background-color: white");
let FB_DB;

/**************************************************************/
// Import all external constants & functions required
/**************************************************************/
// Import all the methods you want to call from the firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  query,
  orderByChild,
  limitToFirst,
  limitToLast,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

/**************************************************************/
// EXPORT FUNCTIONS
// List all the functions called by code or html outside of this module
/**************************************************************/
export {
  fb_initialize,
  fb_authenticate,
  fb_write,
  fb_read,
  fb_readSorted,
  fb_onAuthStateChanged,
  fb_onValue,
};

/**************************************************************/
// EXPORT FUNCTIONS
// List all the functions called by code or html outside of this module
/**************************************************************/
function fb_initialize() {
  console.log("fb_initialize");
  const FB_Cfg = {
    apiKey: "AIzaSyBMIIDBNTsiyjzbIqdMcWDZF2bKbgzsMRo",
    authDomain: "fir-refresher-f1f18.firebaseapp.com",
    databaseURL:
      "https://fir-refresher-f1f18-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fir-refresher-f1f18",
    storageBucket: "fir-refresher-f1f18.firebasestorage.app",
    messagingSenderId: "365813686783",
    appId: "1:365813686783:web:bd17c674d2988f20f787ca",
    measurementId: "G-T28VLJSKEQ",
  };
  const FB_APP = initializeApp(FB_Cfg);
  FB_DB = getDatabase(FB_APP);
  console.info(FB_DB);
}

async function fb_authenticate() {
  const AUTH = getAuth();
  const PROVIDER = new GoogleAuthProvider();

  return new Promise((resolve) => {
    (async () => {
      PROVIDER.setCustomParameters({
        prompt: "select_account",
      });
      try {
        const RESULT = await signInWithPopup(AUTH, PROVIDER);
        resolve(RESULT);
      } catch (error) {
        console.log(error);
      }
    })();
  });
}

async function fb_write(input, path) {
  console.log(input);
  const dbReference = ref(FB_DB, path);
  await set(dbReference, input);
  /*
    return new Promise((resolve) =>{
        (async () => {
            try{
                const RESULT = await set(dbReference, input)
                resolve(RESULT)
                console.log("✅ Successful write")
            }
            catch(error){
                console.log(error)
            }
        })
    })*/
}

async function fb_read(path) {
  console.log(
    "%c fb_read(" + path + "):",
    "color: " + COL_C + " background-color: " + COL_B + "",
  );
  const dbReference = ref(FB_DB, path);
  try {
    const snapshot = await get(dbReference);
    var fb_data = snapshot.val();
    if (fb_data != null) {
      console.log("✅ Successful read");
      //console.table(fb_data)
      return fb_data;
    } else {
      console.log("✅ No record found");
    }
  } catch (error) {
    console.log(error);
  }
}

async function fb_readSorted(path, key, amount) {
  const dbReference = query(
    ref(FB_DB, path),
    orderByChild(key),
    limitToLast(amount),
  );
  try {
    const snapshot = await get(dbReference);
    if (snapshot.val() != null) {
      var result = [];
      snapshot.forEach((child) => {
        result.push(child.val());
      });
      //console.log(result)
      return result.reverse();
    } else {
      console.log("✅ Code for no record found goes here");
    }
  } catch (error) {
    console.log(error);
  }
}

function fb_onAuthStateChanged() {
  console.log(
    "%c fb_onAuthStateChanged(): ",
    "color: " + COL_C + " background-color: " + COL_B + "",
  );
  const AUTH = getAuth();
  onAuthStateChanged(
    AUTH,
    (user) => {
      if (user) {
        console.log("✅ AuthStateChanged - user logged in");
      } else {
        console.log("✅ AuthStateChanged - user logged out");
      }
    },
    (error) => {
      console.log("❌ error");
    },
  );
}

async function fb_onValue(_path) {
  const REF = ref(FB_DB, _path);
  /*
  return new Promise((resolve) => {
    (async () => {
      try {
        const RESULT = await onValue(REF, (snapshot));
        resolve(RESULT);
      } catch (error) {
        console.log(error);
      }
    })();
  });*/
  let initail = true;
  const LISTENER = await onValue(REF, (snapshot) => {
    console.log("change");
    //console.log(snapshot);
  });
}
