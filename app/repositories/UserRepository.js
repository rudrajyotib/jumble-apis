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
        const targetFriend = await repository
            .collection("friends")
            .doc(sourceFriendId)
            .collection('friendlist')
            .doc(targetFriendId)

        const targetFriendData = await targetFriend.get()

        if (!targetFriendData.exists) {
            await targetFriend.set({
                name: targetFriendName,
                status: friendRequestStatus
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
        console.log('target friend found to be ::' + JSON.stringify(targetFriend))
        if (!targetFriend.exists) {
            return false
        } else {
            return true
        }
    }



}

module.exports = userRepository