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
        username: await validateUserName('username_in'),
        uid: sessionStorage.getItem("uid"),
        email: sessionStorage.getItem("email"),
        photoURL: sessionStorage.getItem("photoURL"),
        displayName: sessionStorage.getItem("displayName"),
    };
    //if any field is undefined do not complete registration, any invalid input is not returned and will be undefined
    for (let i = 0; i < Object.values(userDetails).length; i++) { if (Object.values(userDetails)[i] == undefined) return }

    await fb_write(userDetails, `/userDetails/${userDetails.uid}`);
    document.getElementById('registration_di').style.display = "none";
    login(userDetails.uid)
    document.getElementById('reg_sc').remove() //does nothing
}

async function validateAdress(addressId) {
    let address = document.getElementById(addressId).value
    address = address.trim()
    if (await checkEmpty(addressId, address)) return;
    return address
}

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

async function validateUserName(userNameID) {
    let userName = document.getElementById(userNameID).value
    userName = userName.trim()
    if (await checkEmpty(userNameID, userName)) return;
    if (userName.length > 20) {
        errorMessage(userNameID, 'username is too long!')
        return
    }
    if (userName.length < 4) {
        errorMessage(userNameID, 'username is too short!')
        return
    }
    return userName
}

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