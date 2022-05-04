const express = require('express');
const router = express.Router()
const challengeRouter = require('./ChallengeRouter')
const loginRouter = require('./LoginRouter')

router.use('/challenge', challengeRouter)
router.use('/login', loginRouter)

module.exports = router