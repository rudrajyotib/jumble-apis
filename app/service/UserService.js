const userRepo = require('../repositories/UserRepository')
const challengeRepo = require('../repositories/ChallengeRepository')
const onlineUserRepo = require('../repositories/OnlineUserRepository')
const { v4: uuidv4 } = require('uuid')
const challengeRepository = require('../repositories/ChallengeRepository')
const serviceUtil = require('./util/ServiceUtil')


const listFriendsWithStatus = async function (userId, status) {
    const friendSearchResult = await userRepo.friendsWithStatus({ sourceUserId: userId, status: status })
        .catch(() => { return { errorCode: -1 } })
    if (-1 === friendSearchResult.errorCode) { return { result: -1 } }
    return { result: 1, friends: friendSearchResult.friends }
}

module.exports = {

    addUser: async function (data) {
        if (!serviceUtil.isValidUserCreateRequest(data)) { return { result: -3 } }
        const appUserInSystemResult = await userRepo.findUserByAppUserId(data.appUserId).catch((err) => { return { result: -1 } })
        if (appUserInSystemResult.result === -1) { return { result: -1 } }
        if (appUserInSystemResult.result === 1) { return { result: -2 } }
        const onlineUser = await onlineUserRepo
            .createUser(data)
            .then((userData) => {
                return { created: true, onlineUserData: userData }
            }).catch((error) => {
                console.log("Erorr in AuthRepo::" + JSON.stringify(error))
                return { created: false }
            })
        if (!onlineUser.created) { return { result: -1 } }
        const userPersisted = await userRepo.addUser({
            userId: onlineUser.onlineUserData.uid,
            name: onlineUser.onlineUserData.displayName,
            email: onlineUser.onlineUserData.email,
            appUserId: data.appUserId
        })
            .then((data) => {
                if (data.result === 0) { return { result: 1 } }
                else { return { result: -1 } }
            })
            .catch((error) => {
                console.log("Erorr in DataRepo::" + error)
                return { result: -1 }
            })
        return userPersisted
    },

    addFriend: async function (data) {
        const duelId = uuidv4()
        const friendRelationExists = await userRepo.isFriend({
            sourceUserId: data.sourceUserId,
            targetUserId: data.targetUserId
        })
        if (friendRelationExists) { return { result: 0, message: 'a friend relation already exists' } }
        const reverseFriendRelationExists = await userRepo.isFriend({ sourceUserId: data.targetUserId, targetUserId: data.sourceUserId })
        if (reverseFriendRelationExists) { return { result: 0, message: 'a friend relation already exists' } }
        const sourceUserData = await userRepo.getUser(data.sourceUserId)
        if (!sourceUserData.found) { return { result: 0, message: 'requestor user does not exist' } }
        const targetUserData = await userRepo.getUser(data.targetUserId)
        if (!targetUserData.found) { return { result: 0, message: 'target friend user does not exist' } }
        const result = await userRepo
            .addFriend({ sourceUserId: data.sourceUserId, targetUserId: data.targetUserId, targetFriendName: targetUserData.name, status: 'awaiting', duelId: duelId })
            .then(() => { return { result: 1 } })
            .catch(() => { return { result: -1, message: 'error in repository' } })
        if (result.result != 1) { return result }
        const reverseResult = await userRepo
            .addFriend({ sourceUserId: data.targetUserId, targetUserId: data.sourceUserId, targetFriendName: sourceUserData.name, status: 'pending', duelId: duelId })
            .then(() => { return { result: 1 } })
            .catch(() => { return { result: -1, message: 'error in repository' } })
        if (reverseResult.result != 1) { return reverseResult }
        const duelResult = await challengeRepo.addDuel({ duelId: duelId, sourceUserId: data.sourceUserId, targetUserId: data.targetUserId, duelStatus: 'open' })
            .catch(() => { return false })
        if (!duelResult) { return { result: -1, message: 'error in repository' } }
        return { result: 1 }
    },

    updateFriendStatus: async function (data) {
        const friendUpdateStatus = await userRepo.updateFriendStatus({ sourceUserId: data.sourceUserId, targetUserId: data.targetUserId, status: data.status })
            .catch(() => { return false })
        if (!friendUpdateStatus) { return { result: -1, message: 'error in repository' } }
        const reverseFriendUpdateStatus = await userRepo
            .updateFriendStatus({ sourceUserId: data.targetUserId, targetUserId: data.sourceUserId, status: data.status })
            .catch(() => { return false })
        if (!reverseFriendUpdateStatus) { return { result: -1, message: 'error in repository' } }
        return { result: 1, message: 'friend status updated' }
    },

    listOfFriendsByStatus: async function (data) {
        return await listFriendsWithStatus(data.sourceUserId, data.status)
    },

    isFriend: async function (data) {
        const result = await userRepo.isFriend({ sourceUserId: data.sourceUserId, targetUserId: data.targetUserId })
            .then((result) => { return result })
            .catch((err) => {
                console.log('service error::' + JSON.stringify(err))
                return false
            })
        return result
    },

    isEligibleForChallenge: async function (sourceUserId, targetUserId) {
        const result = await userRepo.getFriendshipDetails(sourceUserId, targetUserId)
            .then((result) => { return result })
            .catch((err) => {
                console.log('service error::' + JSON.stringify(err))
                return { found: false }
            })
        if (!result.found || 'confirmed' != result.status || !result.duelId || '' === result.duelId) { return false }
        const duelData = await challengeRepository.getDuel(result.duelId).catch((err) => { return { found: false } })
        if (!duelData.found) { return false }
        const duelDetails = duelData.data
        if ('open' === duelDetails.status || ('active' === duelDetails.status && sourceUserId === duelDetails.sourceUserId)) { return true }
        return false
    },

    getFriendshipDetailsForChallenge: async function (sourceUserId, targetUserId) {
        const result = await userRepo.getFriendshipDetails(sourceUserId, targetUserId)
            .then((result) => { return result })
            .catch((err) => {
                console.log('service error::' + JSON.stringify(err))
                return { found: false }
            })
        if (!result.found || 'confirmed' != result.status || !result.duelId || '' === result.duelId) {
            return {
                isFriend: false
            }
        }
        const duelData = await challengeRepository.getDuel(result.duelId).catch((err) => { return { found: false } })
        if (!duelData.found) {
            return {
                isFriend: false
            }
        }
        const duelDetails = duelData.data
        const sourceUserScore = duelDetails.score[sourceUserId]
        const targetUserScore = duelDetails.score[targetUserId]
        const friendshipResult = {
            isFriend: true,
            challengeable: false,
            sourceUserScore: sourceUserScore,
            targetUserScore: targetUserScore
        }
        if ('open' === duelDetails.status || ('active' === duelDetails.status && sourceUserId === duelDetails.sourceUserId)) {
            friendshipResult.challengeable = true
        }
        return friendshipResult
    },


    findUserByAppUserId: async function (appUserId) {
        return await userRepo.findUserByAppUserId(appUserId).catch((err) => { return { result: -1 } })
    }
}

