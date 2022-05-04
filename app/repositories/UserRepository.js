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
            } else {
                userData = user.data()
                return {
                    found: true,
                    id: userId,
                    name: userData.name,
                    email: userData.email
                }
            }
        } catch (err) {
            return { found: false }
        }
    }

}

module.exports = userRepository