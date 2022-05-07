const express = require('express')
const loginRouter = express.Router()
const userController = require('../controller/UserController')

loginRouter.post("/addfriend", userController.addFriend)
loginRouter.get("/isfriend", userController.isFriend)
loginRouter.post("/signup", userController.signUp)
loginRouter.post("/confirmfriend", userController.confirmFriend)
loginRouter.get("/friends/:userId", userController.listFriends)
loginRouter.get("/pendingfriends/:userId", userController.listPendingFriendRequests)


module.exports = loginRouter