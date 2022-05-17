const verifyCreateChallengeRequest = (req) => {
    if (!req.body) { return false }
    if (!req.body.question) { return false }

    return true
}

module.exports = { verifyCreateChallengeRequest }