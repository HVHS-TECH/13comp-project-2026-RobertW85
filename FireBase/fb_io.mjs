//**************************************************************/
// fb_io.mjs
// Generalised firebase routines
// Written by Robert, Term 1 2026
//
// All variables & function begin with fb_  all const with FB_
// Diagnostic code lines have a comment appended to them //DIAG
/**************************************************************/
let FB_DB;

/**************************************************************/
// Import all external constants & functions required
/**************************************************************/
// Import all the methods you want to call from the firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase,ref,set,get,onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth,GoogleAuthProvider,signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

/**************************************************************/
// EXPORT FUNCTIONS
// List all the functions called by code or html outside of this module
/**************************************************************/
export {
    fb_initialize,
    fb_authenticate,
    fb_write,
    fb_read,
    fb_onValue,
    fb_readSorted,
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
    console.log(`Write ${input} at ${path}`);
    const dbReference = ref(FB_DB, path);
    await set(dbReference, input);
}

async function fb_read(path) {
    const dbReference = ref(FB_DB, path);
    try {
        const snapshot = await get(dbReference);
        var fb_data = snapshot.val();
        if (fb_data != null) {
            return fb_data;
        } else {
            console.log("No record found");
        }
    } catch (error) {
        console.log(error);
    }
}

async function fb_onValue(_path) {
    return new Promise((resolve) => {
        let old;
        const REF = ref(FB_DB, _path);
        onValue(REF, (snapshot) => {
            if (snapshot.val() != old && old != null) {
                resolve(snapshot.val());
            }
            old = snapshot.val();
        });
    });
}

async function fb_readSorted(path, key, amount) {
    const dbReference = query(
        ref(FB_GAMEDB, path),
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
            return result.reverse();
        } else {
            console.log("No record found goes here");
        }
    } catch (error) {
        console.log(error);
    }
}
