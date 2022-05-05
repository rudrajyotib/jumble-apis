const admin = require('firebase-admin')
const userService = require('../../service/UserService')
const userUtil = require('../utils/UserApiUtil')

const addFriend = async function (request, response, next) {
    const reqBody = request.body
    await userService
        .addFriend({
            sourceUserId: reqBody.sourceUserId,
            targetUserId: reqBody.targetUserId
        })
        .then((result) => {
            if (result.result == 1) {
                response.status(200).send("Friends created Ok")
            } else if (result.result == 0) {
                response.status(400).send(result.message)
            } else {
                response.status(500).send(result.message)
            }
        })
        .catch((error) => {
            response.status(500).send("User not created due to unhandled backend error")
        })
}

const isFriend = async function (request, response, next) {
    const reqBody = request.body
    await userService
        .isFriend({
            sourceUserId: reqBody.sourceUserId,
            targetUserId: reqBody.targetUserId
        })
        .then((isFriend) => {
            response.status(200).send({ friend: isFriend })
        })
        .catch((error) => {
            console.log(JSON.stringify(error))
            response.status(500).send("User not created")
        })
}

const confirmFriend = async function (request, response, next) {
    const reqBody = request.body
    await userService
        .updateFriendStatus({
            sourceUserId: reqBody.sourceUserId,
            targetUserId: reqBody.targetUserId,
            status: 'confirmed'
        })
        .then((output) => {
            if (1 === output.result) {
                response.status(200).send({ friendStatus: 'confirmed' })
            } else {
                response.status(400).send('update failed')
            }

        })
        .catch(() => {
            response.status(500).send('update failed')
        })
}

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

module.exports = { signUp, addFriend, isFriend, confirmFriend }