const verifyCreateChallengeRequest = (req) => {

    if (!req.body) {
        return false
    }

    var challenge = req.body

    if (!challenge.requestedBy || !challenge.targetUser) {
        return false
    }


    return true
}

module.exports = { verifyCreateChallengeRequest }