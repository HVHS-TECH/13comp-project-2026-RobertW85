import { fb_write, fb_initialize } from "./FireBase/fb_io.mjs";
fb_initialize();

/**
 * will write user details if all inputs are valid
 */
async function submit() {
    let userDetails = {
        address: await validateAdress(document.getElementById("addressInput").value),
        phone: await validatePhoneNumber(document.getElementById("phoneInput").value),
        age: await validateAge(document.getElementById("ageInput").value),
        username: await validateUserName(document.getElementById("usernameInput").value),
        uid: sessionStorage.getItem("uid"),
        email: sessionStorage.getItem("email"),
        photoURL: sessionStorage.getItem("photoURL"),
        displayName: sessionStorage.getItem("displayName"),
    };
    for (let i =0; i < Object.values(userDetails).length; i++){if (Object.values(userDetails)[i] == undefined){return}}
    console.log("valid")
    //await fb_write(userDetails, "/userDetails/" + userDetails.uid);
    //window.location.href = "index.html";
}

async function validateAdress(address){
    address = address.trim()
    if (await checkEmpty(address, 'address')){return}
    return address
}

async function validatePhoneNumber(phoneNumber){
    phoneNumber = Number(phoneNumber)
    if (await checkEmpty(phoneNumber, 'phoneNumber')){return}
    if (isNaN(phoneNumber)){
        errorMessage(phoneNumber, 'phone number is not a number')
        return
    }
    if (phoneNumber != parseInt(phoneNumber)){
        errorMessage(phoneNumber, 'phone number is not valid')
        return
    }
    return phoneNumber
}

async function validateAge(age){
    age = parseInt(Number(age))
    if (await checkEmpty(age, 'age')){return}
    if (isNaN(age)){
        errorMessage(age, 'age is not a number')
        return
    }
    if (age > 122 || age < 5){
        errorMessage(age, 'enter your real age')
        return
    }
    return age
}

async function validateUserName(userName){  
    userName = userName.trim()
    if (await checkEmpty(userName, 'userName')){return}
    if (userName.length > 20){
        errorMessage(userName, 'username is too long!')
        return
    }
   if (userName.length < 4){
        errorMessage(userName, 'username is too short!')
        return
   }
    return userName
}

async function checkEmpty(input, inputName){
    if (input == ''){
        let aN = inputName[0] == 'a' ? 'an' : 'a'
        errorMessage(inputName, `enter ${aN} ${inputName}`)
        return true
    }
    return false
}

function errorMessage(inputName, message){
    console.log(message)
}
window.submit = submit;
