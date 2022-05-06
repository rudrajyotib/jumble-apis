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
                email: userData.email
            })
            .catch((err) => {
                console.log("Error inserting data into Repo::" + JSON.stringify(err))
                result = 1
            })

        if (result == 0) {
            return userData.userId
        }
        throw new Error("User could not be added to repository")
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
    }



}

module.exports = userRepository