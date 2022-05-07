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
        await challengeService
            .addChallenge(inputObject)
            .then(challengeId => {
                res.status(200).send(challengeId)
            })
            .catch(() => {
                res.status(500).send('Could not complete add challenge request due to a backend error')
            })
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

module.exports = { addChallenge, getDuelData }