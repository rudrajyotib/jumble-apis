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
    }

}

module.exports = userRepository