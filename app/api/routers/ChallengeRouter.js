const express = require('express')
const challengeRouter = express.Router()
const challengeController = require('../controller/ChallengeController')

challengeRouter.post("/", challengeController.addChallenge)
challengeRouter.get("/duel/:duelId", challengeController.getDuelData)

module.exports = challengeRouter