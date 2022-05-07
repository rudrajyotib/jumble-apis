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
    },

    getDuelData: async function (duelId) {
        duelData = await challengeRepo.getDuel(duelId).catch(() => { return { found: false } })
        return duelData
    }
}

module.exports = challengeService