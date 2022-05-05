const express = require('express');
const router = express.Router()
const challengeRouter = require('./ChallengeRouter')

const userRouter = require('./UserRouter')

router.use('/challenge', challengeRouter)
router.use('/user', userRouter)

module.exports = router