/**
 * @description register account to fire base
 * Writen by Robert Watt
 * Term 1-2 2026
 */
import { fb_write } from "./FireBase/fb_io.mjs";
import { login } from "./index.mjs";

/**
 * will write user details if all inputs are valid
 */
async function submit() {
    document.querySelectorAll('.errorMessages').forEach(element => { element.remove() })

    let userDetails = {
        address: await validateAdress('address_in'),
        phone: await validatePhoneNumber('phoneNumber_in'),
        age: await validateAge('age_in'),
        username: await validateusername('username_in'),
        uid: sessionStorage.getItem("uid"),
        email: sessionStorage.getItem("email"),
        photoURL: sessionStorage.getItem("photoURL"),
        googleName: sessionStorage.getItem("googleName"),
    };
    //if any field is undefined do not complete registration, any invalid input is not returned and will be undefined
    for (let i = 0; i < Object.values(userDetails).length; i++) { if (Object.values(userDetails)[i] == undefined) return }
    let privateDetails = {
        address: userDetails.address,
        phone: userDetails.phone,
        age: userDetails.age,
        email: userDetails.email,
        googleName: userDetails.googleName
    }
    let publicDetails = {
        username: userDetails.username,
        photoURL: userDetails.photoURL,
        uid: userDetails.uid
    }
    await fb_write(publicDetails, `/userDetails/${userDetails.uid}/public`);
    await fb_write(privateDetails, `/userDetails/${userDetails.uid}/private`);
    document.getElementById('registration_di').style.display = "none";
    login(userDetails.uid)
    document.getElementById('reg_sc').remove() //does not fully unload script
}

/**
 * checks if address is valid
 * @param {string} addressId id of address input
 * @returns address or null if invalid
 */
async function validateAdress(addressId) {
    let address = document.getElementById(addressId).value
    address = address.trim()
    if (await checkEmpty(addressId, address)) return;
    return address
}

/**
 * checks if phoneNumber is valid
 * @param {string} phoneNumberID id of phoneNumber input
 * @returns phonenumber or null if invalid
 */
async function validatePhoneNumber(phoneNumberID) {
    let phoneNumber = Number(document.getElementById(phoneNumberID).value)
    if (await checkEmpty(phoneNumberID, phoneNumber)) return;
    if (isNaN(phoneNumber)) {
        errorMessage(phoneNumberID, 'phone number is not a number')
        return
    }
    if (phoneNumber != parseInt(phoneNumber)) {
        errorMessage(phoneNumberID, 'phone number is not valid')
        return
    }
    if (phoneNumber.length > 11) {
        errorMessage(phoneNumberID, 'phone number is too long')
        return
    }
    if (phoneNumber.length < 9) {
        errorMessage(phoneNumberID, 'phone number is too short')
        return
    }
    return phoneNumber
}

/**
 * check if age is valid
 * @param {string} ageID id of age input 
 * @returns age or null if invalid
 */
async function validateAge(ageID) {
    let age = document.getElementById(ageID).value
    age = parseInt(Number(age))
    if (await checkEmpty(ageID, age)) return;
    if (isNaN(age)) {
        errorMessage(ageID, 'age is not a number')
        return
    }
    if (age > 122 || age < 5) {
        errorMessage(ageID, 'enter your real age')
        return
    }
    return age
}

/**
 * check if username is valid
 * @param {string} usernameID id of username input
 * @returns username or null if invalid
 */
async function validateusername(usernameID) {
    let username = document.getElementById(usernameID).value
    username = username.trim()
    if (await checkEmpty(usernameID, username)) return;
    if (username.length > 20) {
        errorMessage(usernameID, 'username is too long!')
        return
    }
    if (username.length < 4) {
        errorMessage(usernameID, 'username is too short!')
        return
    }
    return username
}

/**
 * check if value is empty or spaces
 * @param {*} id id of element for error message
 * @param {*} value value to check if is empty
 * @returns 
 */
async function checkEmpty(id, value) {
    if (value == '') {
        let idName = id.slice(0, -3)
        const firstCap = idName.match(/[A-Z]/)
        if (firstCap) {
            idName = idName.slice(0, firstCap.index) + " " + firstCap[0].toLowerCase() + idName.slice(firstCap.index + 1)
        }
        errorMessage(id, `enter ${id[0] == 'a' ? 'an' : 'a'} ${idName}`)
        return true
    }
    return false
}

/**
 * displays an error message
 * @param {string} inputID id of element that message will be under
 * @param {string} message
 */
function errorMessage(inputID, message) {
    let element = document.getElementById(inputID)
    let err_p = document.createElement('p')
    err_p.innerHTML = message
    err_p.className = 'errorMessages'
    let form = element.parentElement
    let formChildren = Array.from(form.children)
    element.after(err_p)
}
window.submit = submit;