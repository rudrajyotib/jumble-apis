const challengeRepo = require('../repositories/ChallengeRepository')
const userRepo = require('../repositories/UserRepository')
const serviceUtil = require('./util/ServiceUtil')


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

    getChallengeData: async function (challengeId) {
        const challengeData = await challengeRepo.getChallenge(challengeId).catch(() => { return { found: false } })
        if (true != challengeData.found || !challengeData.data) { return { found: false } }
        return challengeData
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
            challengeData = duelInput.challengeData
            if (!serviceUtil.isValidChallenge(challengeData)) { return false }
            const challenge = await challengeRepo.addChallenge(challengeData).then((challengeId) => { return { result: true, challengeId: challengeId } }).catch(() => { return { result: false } })
            if (!challenge.result) { return false }
            updateEvent.challengeId = challenge.challengeId
            updateEvent.status = 'pendingAction'
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
    },

    listOfPendingDuels: async function (targetUserId) {
        if (!targetUserId || '' === targetUserId) { return { found: false } }
        const pendingDuels = await challengeRepo.getDuelsByTargetUserAndStatus(targetUserId, 'pendingAction').catch(() => { return { errorCode: -1 } })
        if (pendingDuels.errorCode != 1) { return { found: false } }
        const result = { found: true, duels: [] }
        await Promise.all(pendingDuels.duels.map(async (duel) => {
            if (!duel.sourceUserId || '' === duel.sourceUserId) { return }
            const duelSourceUser = await userRepo.getUser(duel.sourceUserId)
            if (duelSourceUser.found) { result.duels.push({ duelId: duel.duelId, sourceUser: duelSourceUser.name, challengeId: duel.challengeId }) }
        }))
        return result
    }
}

module.exports = challengeService