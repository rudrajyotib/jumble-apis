const { use } = require('chai')
const sourceRepo = require('../infra/DataSource')

const repository = sourceRepo.repository
var userRepository = {


    addUser: async function (userData) {
        let result = 0
        await repository
            .collection("users")
            .doc(userData.userId)
            .set({
                name: userData.name,
                email: userData.email,
                appUserId: userData.appUserId
            })
            .catch((err) => {
                console.log("Error inserting data into Repo::" + JSON.stringify(err))
                result = 1
            })

        if (result == 0) {
            return { result: result, userId: userData.userId }
        }
        else {
            return { result: result }
        }
    },

    findUserByAppUserId: async function (appUserId) {
        const userData = await repository.collection("users")
            .where("appUserId", "=", appUserId)
            .get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) { return { result: 0 } }
                const user = querySnapshot.docs[0].get()
                return { result: 1, email: user.email }
            })
            .catch((err) => { return { result: -1 } })
        return userData
    },


    getUser: async function (userId) {
        try {
            const user = await repository
                .collection("users")
                .doc(userId)
                .get()
                .catch((err) => {
                    return { exists: false }
                })
            if (!user.exists) {
                return { found: false }
            }
            userData = user.data()
            return {
                found: true,
                id: userId,
                name: userData.name,
                email: userData.email
            }

        } catch (err) {
            return { found: false }
        }
    },

    addFriend: async function (friendRequest) {
        const sourceFriendId = friendRequest.sourceUserId
        const targetFriendId = friendRequest.targetUserId
        const targetFriendName = friendRequest.targetFriendName
        const friendRequestStatus = friendRequest.status
        const duelId = friendRequest.duelId
        const targetFriend = await repository
            .collection("friends")
            .doc(sourceFriendId)
            .collection('friendlist')
            .doc(targetFriendId)

        const targetFriendData = await targetFriend.get()

        if (!targetFriendData.exists) {
            await targetFriend.set({
                name: targetFriendName,
                status: friendRequestStatus,
                duelId: duelId
            })
        }
    },

    updateFriendStatus: async function (friendsData) {
        const sourceFriendId = friendsData.sourceUserId
        const targetFriendId = friendsData.targetUserId
        const targetFriend = await repository
            .collection("friends")
            .doc(sourceFriendId)
            .collection('friendlist')
            .doc(targetFriendId)
        const result = await targetFriend
            .update({ status: friendsData.status })
            .then(() => { return true })
            .catch(() => { return false })
        return result
    },

    friendsWithStatus: async function (friendsData) {
        const sourceFriendId = friendsData.sourceUserId
        // const targetFriendId = friendsData.targetUserId
        const targetFriendList = await repository
            .collection("friends")
            .doc(sourceFriendId)
            .collection('friendlist')

        const result = { errorCode: 0, friends: [] }
        await targetFriendList
            .where("status", "=", friendsData.status)
            .get()
            .then((querySnapshot) => {
                result.errorCode = 1
                querySnapshot.forEach((doc) => {
                    result.friends.push({
                        id: doc.id,
                        name: doc.data().name
                    })
                })
            })
            .catch((err) => {
                result.errorCode = -1
            })
        return result
    },

    isFriend: async function (friendRequest) {

        const sourceFriendId = friendRequest.sourceUserId
        const targetFriendId = friendRequest.targetUserId
        const targetFriend = await repository
            .collection("friends")
            .doc(sourceFriendId)
            .collection('friendlist')
            .doc(targetFriendId)
            .get()
            .catch((err) => {
                console.log('Friendlist check throws error')
                return { exists: false }
            })
        if (!targetFriend.exists) {
            return false
        } else {
            return true
        }
    },

    getFriendshipDetails: async function (sourceUserId, targetUserId) {
        const targetFriend = await repository
            .collection("friends")
            .doc(sourceUserId)
            .collection('friendlist')
            .doc(targetUserId)
            .get()
            .catch((err) => {
                console.log('Friendlist check throws error')
                return { exists: false }
            })
        if (!targetFriend.exists) {
            return { found: false }
        } else {
            return {
                found: true,
                status: targetFriend.data().status,
                duelId: targetFriend.data().duelId
            }
        }
    }



}

module.exports = userRepository