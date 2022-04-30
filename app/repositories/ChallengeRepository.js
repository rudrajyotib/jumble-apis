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
    }

}

module.exports = challengeRepository