const sourceRepo = require('../infra/DataSource')
const { v4: uuidv4 } = require('uuid')

const repository = sourceRepo.repository
var challengeRepository = {

    addChallenge: async function (challengeData) {
        const challengeId = uuidv4()
        let result = 0
        await repository
            .collection("challenges")
            .doc(challengeId)
            .set(challengeData)
            .catch((err) => {
                result = 1
            })
        if (result === 0) {
            return challengeId
        }
        throw new Error("challenge not created")
    },

    updateDuel: async function (duelUpdate) {
        if (!duelUpdate.duelId || '' === duelUpdate.duelId) { return false }
        let duelDocReference = await repository.collection("duel").doc(duelUpdate.duelId)
        let duelDoc = await duelDocReference.get()
        if (!duelDoc.exists) { return false }
        duelPersistedData = (await duelDoc).data()
        const duelDataUpdate = {}
        if (!'' != duelUpdate.status) { duelDataUpdate.duelStatus = duelUpdate.status }
        if (duelUpdate.scoreUpdate) {
            duelDataUpdate.score = duelPersistedData.score
            duelDataUpdate.score[duelPersistedData.targetUserId] += 1
        }
        if (duelUpdate.roleChange) {
            duelDataUpdate.sourceUserId = duelPersistedData.targetUserId
            duelDataUpdate.targetUserId = duelPersistedData.sourceUserId
        }
        if ('' != duelUpdate.challengeId) {
            duelDataUpdate.challengeId = duelUpdate.challengeId
        }
        const updateResult = await duelDocReference.update(duelDataUpdate).then(() => { return true }).catch(() => { return false })
        return updateResult
    },

    addDuel: async function (duelData) {
        const duelId = duelData.duelId
        const sourceUserId = duelData.sourceUserId
        const targetUserId = duelData.targetUserId
        const duelStatus = duelData.duelStatus
        let result = 0
        let initialScore = {}
        initialScore[sourceUserId] = 0
        initialScore[targetUserId] = 0
        let duel = await repository.collection("duel").doc(duelId)

        let persistedDuelData = await duel.get()
        if (persistedDuelData.exists) { return false }
        await duel
            .set({ sourceUserId: sourceUserId, targetUserId: targetUserId, duelStatus: duelStatus, score: initialScore })
            .catch(() => { result = 1 })
        if (result === 0) { return true }
        return false
    },

    getDuel: async function (duelId) {
        let duelDoc = await repository.collection("duel").doc(duelId).get()
        if (duelDoc.exists) {
            const duel = duelDoc.data()
            { return { found: true, data: { status: duel.duelStatus, sourceUserId: duel.sourceUserId, targetUserId: duel.targetUserId, challengeId: duel.challengeId, score: duel.score } } }
        }
        return { found: false }
    }

}

module.exports = challengeRepository