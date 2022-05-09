const challengeService = require('../../service/ChallengeService')
const challengeUtil = require('../utils/ChallengeApiUtil')

const addChallenge = async (req, res, next) => {
    if (challengeUtil.verifyCreateChallengeRequest(req)) {
        var body = req.body
        const inputObject = {}
        inputObject.challenger = body.requestedBy
        inputObject.targetUser = body.targetUser
        inputObject.challengeDate = body.challengeDate
        inputObject.question = body.question
        inputObject.duelId = req.params.duelId
        inputObject.duelEvent = 'challenge'
        await challengeService
            .updateDuelData(inputObject)
            .then((result) => { if (result) { res.status(204).send() } else { res.status(400).send() } })
            .catch(() => { res.status(500).send() })
    } else {
        res.status(400).send("valid challenge data not found")
    }
}

const getDuelData = async (req, res, next) => {
    const duelData = await challengeService.getDuelData(req.params.duelId).catch(() => { return { found: false } })
    if (!duelData.found) {
        res.status(204).send()
    } else {
        res.status(200).send(duelData.data)
    }
}

const attemptChallenge = async (req, res, next) => {
    const duelUpdateResult = await updateDuelStatus(req.params.duelId, 'attempt')
    if (true === duelUpdateResult) {
        res.status(204).send()
    } else {
        res.status(400).send()
    }
}

const duelSuccess = async (req, res, next) => {
    const duelUpdateResult = await updateDuelStatus(req.params.duelId, 'success')
    if (true === duelUpdateResult) {
        res.status(204).send()
    } else {
        res.status(400).send()
    }
}

const duelFailure = async (req, res, next) => {
    const duelUpdateResult = await updateDuelStatus(req.params.duelId, 'failure')
    if (true === duelUpdateResult) {
        res.status(204).send()
    } else {
        res.status(400).send()
    }
}

const updateDuelStatus = async (duelId, state) => {
    const duelUpdateInput = { duelId: duelId, duelEvent: state }
    return await challengeService.updateDuelData(duelUpdateInput).catch(() => { return false })
}

module.exports = { addChallenge, getDuelData, attemptChallenge, duelSuccess, duelFailure }