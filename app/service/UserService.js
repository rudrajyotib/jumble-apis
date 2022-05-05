const userRepo = require('../repositories/UserRepository')
const onlineUserRepo = require('../repositories/OnlineUserRepository')
const { addFriend } = require('../repositories/UserRepository')

module.exports = {

    addUser: async function (data) {
        const onlineUserData = await onlineUserRepo
            .createUser(data)
            .catch((error) => {
                console.log("Erorr in AuthRepo::" + JSON.stringify(error))
                throw error
            })
        await userRepo.addUser({
            userId: onlineUserData.uid,
            name: onlineUserData.displayName,
            email: onlineUserData.email
        }).catch((error) => {
            console.log("Erorr in DataRepo::" + JSON.stringify(error))
            throw error
        })
    },

    addFriend: async function (data) {
        const friendRelationExists = await userRepo.isFriend({
            sourceUserId: data.sourceUserId,
            targetUserId: data.targetUserId
        })
        if (friendRelationExists) {
            return { result: 0, message: 'a friend relation already exists' }
        }
        const reverseFriendRelationExists = await userRepo.isFriend({
            sourceUserId: data.targetUserId,
            targetUserId: data.sourceUserId
        })
        if (reverseFriendRelationExists) {
            return { result: 0, message: 'a friend relation already exists' }
        }
        const sourceUserData = await userRepo.getUser(data.sourceUserId)
        if (!sourceUserData.found) {
            return { result: 0, message: 'requestor user does not exist' }
        }
        const targetUserData = await userRepo.getUser(data.targetUserId)
        if (!targetUserData.found) {
            return { result: 0, message: 'target friend user does not exist' }
        }
        const result = await userRepo
            .addFriend({ sourceUserId: data.sourceUserId, targetUserId: data.targetUserId, targetFriendName: targetUserData.name, status: 'awaiting' })
            .then(() => {
                return { result: 1 }
            })
            .catch(() => {
                return { result: -1, message: 'error in repository' }
            })
        if (result.result != 1) {
            return result
        }
        const reverseResult = await userRepo
            .addFriend({ sourceUserId: data.targetUserId, targetUserId: data.sourceUserId, targetFriendName: sourceUserData.name, status: 'awaiting' })
            .then(() => {
                return { result: 1 }
            })
            .catch(() => {
                return { result: -1, message: 'error in repository' }
            })
        return reverseResult
    },

    isFriend: async function (data) {
        const result = await userRepo
            .isFriend({
                sourceUserId: data.sourceUserId,
                targetUserId: data.targetUserId
            })
            .then((result) => {
                return result
            })
            .catch((err) => {
                console.log('service error::' + JSON.stringify(err))
                return false
            })
        return result
    }


}