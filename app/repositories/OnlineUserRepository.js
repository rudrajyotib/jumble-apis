const sourceRepo = require('../infra/DataSource')

const authenticator = sourceRepo.authenticator

module.exports = {
    createUser: async function (userData) {
        let user = await authenticator
            .createUser(userData)
            .catch((err) => {
                console.log("authenticator error::" + JSON.stringify(err))
                throw new Error('User could not be created at online repo')
            })
        return user
    }
}