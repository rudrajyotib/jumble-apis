const userRepo = require('../repositories/UserRepository')
const onlineUserRepo = require('../repositories/OnlineUserRepository')

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
    }


}