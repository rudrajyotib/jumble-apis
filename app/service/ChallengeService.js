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
    },

    updateDuelData: async function (duelInput) {
        const duelId = duelInput.duelId
        if (!duelId || '' === duelId.trim()) { return false }
        const duelEvent = duelInput.duelEvent
        if (!duelEvent || '' === duelEvent.trim()) { return false }
        const updateEvent = { duelId: duelId }
        if ('challenge' === duelEvent) {
            const challenge = await challengeRepo.addChallenge(duelInput.challengeData).then((challengeId) => { return { result: true, challengeId: challengeId } }).catch(() => { return { result: false } })
            if (!challenge.result) { return false }
            updateEvent.challengeId = challenge.challengeId
            updateEvent.status = 'active'
        } else if ('success' === duelEvent) {
            updateEvent.status = 'active'
            updateEvent.scoreUpdate = true
            updateEvent.roleChange = true
        } else if ('failure' === duelEvent) {
            updateEvent.status = 'active'
            updateEvent.roleChange = true
        } else if ('attempt' === duelEvent) {
            updateEvent.status = 'inProgress'
        }
        const updateResult = await challengeRepo.updateDuel(updateEvent).catch(() => { return false })
        return updateResult
    }
}

module.exports = challengeService