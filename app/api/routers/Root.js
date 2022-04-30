const express = require('express');
const router = express.Router()
const challengeRouter = require('./ChallengeRouter')

router.use('/challenge', challengeRouter)

module.exports = router