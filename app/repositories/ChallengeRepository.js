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
        // console.log('Repofound duel::' + JSON.stringify(duel))
        // if (duel.exists) { return { found: true, data: { status: duel.duelStatus, sourceUserId: duel.sourceUserId, targetUserId: duel.targetUserId, challengeId: duel.challengeId, score: duel.score } } }
        return { found: false }
    }

}

module.exports = challengeRepository