const express = require('express')
const challengeRouter = express.Router()
const challengeController = require('../controller/ChallengeController')

challengeRouter.post("/", challengeController.addChallenge)

module.exports = challengeRouter