const express = require('express')
const loginRouter = express.Router()
const loginController = require('../controller/LoginController')

loginRouter.post("/signup", loginController.signUp)


module.exports = loginRouter