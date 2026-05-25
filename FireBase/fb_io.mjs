/**
 * fb_io.mjs
 * Generalised firebase routines
 * Written by Robert Watt
 * mostly Term 1-2 2026
 * 2025- fb_intialize - fb_authenticate - fb_read - fb_readsorted
 */
let FB_DB;

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, get, onValue, query, orderByChild, limitToLast, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

export {
    fb_initialize,
    fb_authenticate,
    fb_write,
    fb_read,
    fb_waitForChange,
    fb_readSorted,
    fb_remove,
    fb_removeOnDisconnect,
    fb_onValue
};

/**
 * needed to be run at the start of any page using fb
 * will set FB_DB for other functions
 */
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
    getAuth()
    console.info(FB_DB);
}

/**
 * get user's email account and google information
 * @returns {Object} email information
 */
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

/**
 * write input to path in database
 * @param {*} input 
 * @param {string} path 
 */
async function fb_write(input, path) {
    console.log(`Write ${input} at ${path}`);
    const dbReference = ref(FB_DB, path);
    await set(dbReference, input);
}

/**
 * read a path and return data from database
 * @param {string} path 
 * @returns {any}
 */
async function fb_read(path) {
    console.log(`read ${path}`)
    const dbReference = ref(FB_DB, path);
    try {
        const snapshot = await get(dbReference);
        var fb_data = snapshot.val();
        if (fb_data != null) {
            return fb_data;
        } else {
            console.log(`No record found:${path}`);
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * will resolve when the path is changed
 * @param {string} path 
 * @returns void
 */
async function fb_waitForChange(path) {
    return new Promise((resolve) => {
        let old;
        const REF = ref(FB_DB, path);
        onValue(REF, (snapshot) => {
            if (old != null) {
                resolve();
            }
            old = snapshot.val();
        });
    });
}

/**
 * runs func when path is updated
 * @param {string} path 
 * @param {Function} func 
 */
async function fb_onValue(path, func) {
    const REF = ref(FB_DB, path)
    onValue(REF, func)
}

/**
 * read a path and return an ordered amount of entrys
 * @param {string} path 
 * @param {string} key 
 * @param {int} amount
 * @returns Array
 */
async function fb_readSorted(path, key, amount) {
    const dbReference = query(ref(FB_DB, path), orderByChild(key), limitToLast(amount));
    const snapshot = await get(dbReference);
    if (snapshot.val() != null) {
        var result = [];
        snapshot.forEach((child) => {
            result.push(child.val())
        });
        return result.reverse();
    } else {
        console.log("No record found goes here");
    }
}

/**
 * used by admin to remove paths
 * @param {string} path 
 */
async function fb_remove(path) {
    console.log(`remove ${path}`)
    await remove(ref(FB_DB, path))
}

/**
 * remove path when user disconnects
 * @param {string} path 
 */
async function fb_removeOnDisconnect(path) {
    const REF = ref(FB_DB, path);
    onDisconnect(REF).remove()
}