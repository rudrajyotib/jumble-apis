const express = require('express')
const challengeRouter = express.Router()
const challengeController = require('../controller/ChallengeController')

challengeRouter.post("/addChallenge/:duelId/:sourceUserId", challengeController.addChallenge)
challengeRouter.post("/attempt/:duelId", challengeController.attemptChallenge)
challengeRouter.post("/success/:duelId", challengeController.duelSuccess)
challengeRouter.post("/failure/:duelId", challengeController.duelFailure)
challengeRouter.get("/duel/:duelId", challengeController.getDuelData)
challengeRouter.get("/challenge/:challengeId", challengeController.getChallengeData)
challengeRouter.get("/pendingduels/:targetUserId", challengeController.listPendingDuels)

module.exports = challengeRouter