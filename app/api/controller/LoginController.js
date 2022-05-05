const admin = require('firebase-admin')
const userService = require('../../service/UserService')
const userUtil = require('../utils/UserApiUtil')

const signUp = async function (request, response, next) {
    let validatedUserInput = userUtil.validateAndConvertUserCreateRequest(request)
    if (!validatedUserInput.valid) {
        response.status(400).send("Not sufficient for user creation")
        return
    }
    await userService
        .addUser(validatedUserInput.userInput)
        .then((user) => {
            response.status(200).send("User created Ok")
        })
        .catch((error) => {
            response.status(500).send("User not created")
        })
}

module.exports = { signUp }