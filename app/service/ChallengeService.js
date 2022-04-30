const challengeRepo = require('../repositories/ChallengeRepository')


const challengeService = {

    addChallenge: async function (challengeData) {
        // const challengeId = uuidv4()
        try {
            const challengeId = await challengeRepo
                .addChallenge(challengeData)
            return challengeId
        } catch (err) {
            throw new Error('Challenege could not be created')
        }
    }
}

module.exports = challengeService