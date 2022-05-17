const sinon = require('sinon')
const { assert } = require('chai')

describe("should operate user operations", function () {

    let userService
    let userRepositoryMock
    let challengeRepositoryMock
    let onlineUserRepositoryMock
    let userRepo
    let challengeRepo
    let onlineUserRepo

    before(function () {
        userService = require('../../../app/service/UserService')
        userRepo = require('../../../app/repositories/UserRepository')
        challengeRepo = require('../../../app/repositories/ChallengeRepository')
        onlineUserRepo = require('../../../app/repositories/OnlineUserRepository')
    })

    beforeEach(function () {
        userRepositoryMock = sinon.mock(userRepo)
        challengeRepositoryMock = sinon.mock(challengeRepo)
        onlineUserRepositoryMock = sinon.mock(onlineUserRepo)
    })

    afterEach(function () {
        userRepositoryMock.restore()
        onlineUserRepositoryMock.restore()
        challengeRepositoryMock.restore()
    })

    it("addUser: should successfully add user to authenticator and repository", async function () {
        const userRepoSearchUserExpectation = userRepositoryMock.expects('findUserByAppUserId').once().resolves({ result: 0 })
        const userRepoAddUserExpectation = userRepositoryMock.expects('addUser').once().resolves({ result: 0, userId: 'someUserId' })
        const onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').once().resolves({
            uid: "someUid",
            email: "someEmail",
            displayName: "someName",
            appUserId: 'someAppUserId',
            providerData: [{
                uid: "someProviderUid",
                displayName: "someProviderDisplayName",
                email: "someProviderEmail",
                appUserId: 'someAppUserId',
                providerId: "someProviderId"
            }]
        })
        const userCreateResult = await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            appUserId: 'someAppUserId',
            disabled: false
        })
        assert.equal(userCreateResult.result, 1)
        // assert.equal('someId', challengeId)
        userRepoAddUserExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        userRepoSearchUserExpectation.verify()
        assert.isTrue(onlineAuthenticatorExpectation.getCall(0).calledBefore(userRepoAddUserExpectation.getCall(0)))
        assert.isTrue(userRepoSearchUserExpectation.getCall(0).calledBefore(onlineAuthenticatorExpectation.getCall(0)))
        assert.equal(onlineAuthenticatorExpectation.getCall(0).args.length, 1)
        sinon.assert.match(onlineAuthenticatorExpectation.getCall(0).args[0], sinon.match((input) => {
            assert.equal(input.email, 'someEmail')
            assert.equal(input.password, 'somePassword')
            assert.equal(input.displayName, 'someName')
            assert.equal(input.appUserId, 'someAppUserId')
            assert.equal(input.disabled, false)
            return true
        }))
        assert.equal(userRepoAddUserExpectation.getCall(0).args.length, 1)
        sinon.assert.match(userRepoAddUserExpectation.getCall(0).args[0], sinon.match((input) => {
            assert.equal(input.userId, 'someUid')
            assert.equal(input.email, 'someEmail')
            assert.equal(input.name, 'someName')
            assert.equal(input.appUserId, 'someAppUserId')
            return true
        }))
    })

    it("addUser: should report failure to add user to repo when repo fails gracefully", async function () {
        const userRepoSearchUserExpectation = userRepositoryMock.expects('findUserByAppUserId').once().resolves({ result: 0 })
        const userRepoExpectation = userRepositoryMock.expects('addUser').once().resolves({ result: 1 })
        const onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').once().resolves({
            uid: "someUid",
            email: "someEmail",
            displayName: "someName",
            appUserId: 'someAppUserId',
            providerData: [{
                uid: "someProviderUid",
                displayName: "someProviderDisplayName",
                email: "someProviderEmail",
                appUserId: 'someAppUserId',
                providerId: "someProviderId"
            }]
        })
        const userCreateResult = await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            appUserId: 'someAppUserId',
            disabled: false
        })
        assert.equal(userCreateResult.result, -1)
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        userRepoSearchUserExpectation.verify()
        assert.isTrue(onlineAuthenticatorExpectation.getCall(0).calledBefore(userRepoExpectation.getCall(0)))
        assert.isTrue(userRepoSearchUserExpectation.getCall(0).calledBefore(onlineAuthenticatorExpectation.getCall(0)))
        assert.equal(onlineAuthenticatorExpectation.getCall(0).args.length, 1)
        sinon.assert.match(onlineAuthenticatorExpectation.getCall(0).args[0], sinon.match((input) => {
            assert.equal(input.email, 'someEmail')
            assert.equal(input.password, 'somePassword')
            assert.equal(input.displayName, 'someName')
            assert.equal(input.appUserId, 'someAppUserId')
            assert.equal(input.disabled, false)
            return true
        }))
        assert.equal(userRepoExpectation.getCall(0).args.length, 1)
        sinon.assert.match(userRepoExpectation.getCall(0).args[0], sinon.match((input) => {
            assert.equal(input.userId, 'someUid')
            assert.equal(input.email, 'someEmail')
            assert.equal(input.name, 'someName')
            assert.equal(input.appUserId, 'someAppUserId')
            return true
        }))
    })

    it("addUser:should return false if insertion to database fails", async function () {
        const userRepoSearchUserExpectation = userRepositoryMock.expects('findUserByAppUserId').once().resolves({ result: 0 })
        const userRepoExpectation = userRepositoryMock.expects('addUser').once().rejects('database error')
        const onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').once().resolves({
            uid: "someUid",
            email: "someEmail",
            displayName: "someName",
            appUserId: 'someAppUserId',
            providerData: [{
                uid: "someProviderUid",
                displayName: "someProviderDisplayName",
                email: "someProviderEmail",
                appUserId: 'someAppUserId',
                providerId: "someProviderId"
            }]
        })
        const result = await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            disabled: false
        })
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        userRepoSearchUserExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        assert.isTrue(onlineAuthenticatorExpectation.getCall(0).calledBefore(userRepoExpectation.getCall(0)))
        assert.isTrue(userRepoSearchUserExpectation.getCall(0).calledBefore(onlineAuthenticatorExpectation.getCall(0)))
        assert.equal(onlineAuthenticatorExpectation.getCall(0).args.length, 1)
        sinon.assert.match(onlineAuthenticatorExpectation.getCall(0).args[0], sinon.match((input) => {
            assert.equal(input.email, 'someEmail')
            assert.equal(input.password, 'somePassword')
            assert.equal(input.displayName, 'someName')
            assert.equal(input.disabled, false)
            return true
        }))
        assert.equal(userRepoExpectation.getCall(0).args.length, 1)
        sinon.assert.match(userRepoExpectation.getCall(0).args[0], sinon.match((input) => {
            assert.equal(input.userId, 'someUid')
            assert.equal(input.email, 'someEmail')
            assert.equal(input.name, 'someName')
            return true
        }))
        assert.equal(result.result, -1)
    })


    it("addUser:should not attempt to add in user repo if online repo fails", async function () {
        const userRepoSearchUserExpectation = userRepositoryMock.expects('findUserByAppUserId').once().resolves({ result: 0 })
        const userRepoExpectation = userRepositoryMock.expects('addUser').never()
        const onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').once().rejects("User exists")
        const result = await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            disabled: false
        })
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        userRepoSearchUserExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        assert.isTrue(userRepoSearchUserExpectation.getCall(0).calledBefore(onlineAuthenticatorExpectation.getCall(0)))
        assert.equal(result.result, -1)

    })

    it("addUser:should not attempt to add in user if appUserId exists", async function () {
        const userRepoSearchUserExpectation = userRepositoryMock.expects('findUserByAppUserId').once().resolves({ result: 1 })
        const userRepoExpectation = userRepositoryMock.expects('addUser').never()
        const onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').never()
        const result = await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            disabled: false
        })
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        userRepoSearchUserExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        assert.equal(result.result, -2)

    })

    it("addUser:should not attempt to add in user if appUserId check fails", async function () {
        const userRepoSearchUserExpectation = userRepositoryMock.expects('findUserByAppUserId').once().resolves({ result: -1 })
        const userRepoExpectation = userRepositoryMock.expects('addUser').never()
        const onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').never()
        const result = await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            disabled: false
        })
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        userRepoSearchUserExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        assert.equal(result.result, -1)

    })

    it("addUser:should not attempt to add in user if appUserId check rejects", async function () {
        const userRepoSearchUserExpectation = userRepositoryMock.expects('findUserByAppUserId').once().rejects({ error: 'mock error' })
        const userRepoExpectation = userRepositoryMock.expects('addUser').never()
        const onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').never()
        const result = await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            disabled: false
        })
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        userRepoSearchUserExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        assert.equal(result.result, -1)

    })

    it("should add users as friends", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.twice().resolves(false)
        userRepoGetUserExpectation.twice()
        userRepoGetUserExpectation.onCall(0).resolves({ found: true, name: 'sourceUserName' })
        userRepoGetUserExpectation.onCall(1).resolves({ found: true, name: 'targetUserName' })
        userRepoAddFriendExpectation.twice().resolves()
        addDuelExpectation.once().resolves(true)
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.sourceUserId, 'someSourceId')
            assert.equal(friendCheckInput.targetUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(1), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.targetUserId, 'someSourceId')
            assert.equal(friendCheckInput.sourceUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(0), sinon.match('someSourceId'))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(1), sinon.match('someTargetId'))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'targetUserName')
            assert.equal(friendRequest.status, 'awaiting')
            assert.exists(friendRequest.duelId)
            assert.isNotEmpty(friendRequest.duelId)
            return true
        }))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(1), sinon.match((friendRequest) => {
            assert.equal(friendRequest.targetUserId, 'someSourceId')
            assert.equal(friendRequest.sourceUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'sourceUserName')
            assert.equal(friendRequest.status, 'pending')
            assert.exists(friendRequest.duelId)
            assert.isNotEmpty(friendRequest.duelId)
            return true
        }))
        sinon.assert.calledWith(addDuelExpectation.getCall(0), sinon.match((duelRequest) => {
            assert.equal(duelRequest.targetUserId, 'someTargetId')
            assert.equal(duelRequest.sourceUserId, 'someSourceId')
            assert.equal(duelRequest.duelStatus, 'open')
            assert.exists(duelRequest.duelId)
            assert.isNotEmpty(duelRequest.duelId)
            return true
        }))

        assert.equal(result.result, 1)
    })

    it("should negate result if duel cannot be added", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.twice().resolves(false)
        userRepoGetUserExpectation.twice()
        userRepoGetUserExpectation.onCall(0).resolves({ found: true, name: 'sourceUserName' })
        userRepoGetUserExpectation.onCall(1).resolves({ found: true, name: 'targetUserName' })
        userRepoAddFriendExpectation.twice().resolves()
        addDuelExpectation.once().resolves(false)
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.sourceUserId, 'someSourceId')
            assert.equal(friendCheckInput.targetUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(1), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.targetUserId, 'someSourceId')
            assert.equal(friendCheckInput.sourceUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(0), sinon.match('someSourceId'))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(1), sinon.match('someTargetId'))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'targetUserName')
            assert.equal(friendRequest.status, 'awaiting')
            assert.exists(friendRequest.duelId)
            assert.isNotEmpty(friendRequest.duelId)
            return true
        }))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(1), sinon.match((friendRequest) => {
            assert.equal(friendRequest.targetUserId, 'someSourceId')
            assert.equal(friendRequest.sourceUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'sourceUserName')
            assert.equal(friendRequest.status, 'pending')
            assert.exists(friendRequest.duelId)
            assert.isNotEmpty(friendRequest.duelId)
            return true
        }))
        sinon.assert.calledWith(addDuelExpectation.getCall(0), sinon.match((duelRequest) => {
            assert.equal(duelRequest.targetUserId, 'someTargetId')
            assert.equal(duelRequest.sourceUserId, 'someSourceId')
            assert.equal(duelRequest.duelStatus, 'open')
            assert.exists(duelRequest.duelId)
            assert.isNotEmpty(duelRequest.duelId)
            return true
        }))

        assert.equal(result.result, -1)
    })

    it("should negate result if duel throws error", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.twice().resolves(false)
        userRepoGetUserExpectation.twice()
        userRepoGetUserExpectation.onCall(0).resolves({ found: true, name: 'sourceUserName' })
        userRepoGetUserExpectation.onCall(1).resolves({ found: true, name: 'targetUserName' })
        userRepoAddFriendExpectation.twice().resolves()
        addDuelExpectation.once().rejects({ error: 'mock error' })
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.sourceUserId, 'someSourceId')
            assert.equal(friendCheckInput.targetUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(1), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.targetUserId, 'someSourceId')
            assert.equal(friendCheckInput.sourceUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(0), sinon.match('someSourceId'))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(1), sinon.match('someTargetId'))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'targetUserName')
            assert.equal(friendRequest.status, 'awaiting')
            assert.exists(friendRequest.duelId)
            assert.isNotEmpty(friendRequest.duelId)
            return true
        }))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(1), sinon.match((friendRequest) => {
            assert.equal(friendRequest.targetUserId, 'someSourceId')
            assert.equal(friendRequest.sourceUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'sourceUserName')
            assert.equal(friendRequest.status, 'pending')
            assert.exists(friendRequest.duelId)
            assert.isNotEmpty(friendRequest.duelId)
            return true
        }))
        sinon.assert.calledWith(addDuelExpectation.getCall(0), sinon.match((duelRequest) => {
            assert.equal(duelRequest.targetUserId, 'someTargetId')
            assert.equal(duelRequest.sourceUserId, 'someSourceId')
            assert.equal(duelRequest.duelStatus, 'open')
            assert.exists(duelRequest.duelId)
            assert.isNotEmpty(duelRequest.duelId)
            return true
        }))

        assert.equal(result.result, -1)
    })

    it("should not add users if reverse friend add fails", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.twice().resolves(false)
        userRepoGetUserExpectation.twice()
        userRepoGetUserExpectation.onCall(0).resolves({ found: true, name: 'sourceUserName' })
        userRepoGetUserExpectation.onCall(1).resolves({ found: true, name: 'targetUserName' })
        userRepoAddFriendExpectation.twice()
        userRepoAddFriendExpectation.onCall(0).resolves()
        userRepoAddFriendExpectation.onCall(1).rejects({ error: 'some error' })
        addDuelExpectation.never()
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.sourceUserId, 'someSourceId')
            assert.equal(friendCheckInput.targetUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(1), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.targetUserId, 'someSourceId')
            assert.equal(friendCheckInput.sourceUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(0), sinon.match('someSourceId'))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(1), sinon.match('someTargetId'))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'targetUserName')
            assert.equal(friendRequest.status, 'awaiting')
            assert.exists(friendRequest.duelId)
            assert.isNotEmpty(friendRequest.duelId)
            return true
        }))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(1), sinon.match((friendRequest) => {
            assert.equal(friendRequest.targetUserId, 'someSourceId')
            assert.equal(friendRequest.sourceUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'sourceUserName')
            assert.equal(friendRequest.status, 'pending')
            assert.exists(friendRequest.duelId)
            assert.isNotEmpty(friendRequest.duelId)
            return true
        }))

        assert.equal(result.result, -1)
    })

    it("should not add user if already friends", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.once().resolves(true)
        userRepoGetUserExpectation.never()
        userRepoAddFriendExpectation.never()
        addDuelExpectation.never()
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.notExists(friendRequest.targetFriendName)
            assert.notExists(friendRequest.status)
            return true
        }))
        assert.equal(result.result, 0)
    })

    it("should not add user if reverse already friends", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.twice()
        userRepoFriendCheckExpectation.onCall(0).resolves(false)
        userRepoFriendCheckExpectation.onCall(1).resolves(true)
        userRepoGetUserExpectation.never()
        userRepoAddFriendExpectation.never()
        addDuelExpectation.never()
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.notExists(friendRequest.targetFriendName)
            assert.notExists(friendRequest.status)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(1), sinon.match((friendRequest) => {
            assert.equal(friendRequest.targetUserId, 'someSourceId')
            assert.equal(friendRequest.sourceUserId, 'someTargetId')
            assert.notExists(friendRequest.targetFriendName)
            assert.notExists(friendRequest.status)
            return true
        }))
        assert.equal(result.result, 0)
    })

    it("should not add user if source user is not found", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.twice().resolves(false)
        userRepoGetUserExpectation.once()
        userRepoGetUserExpectation.onCall(0).resolves({ found: false })
        userRepoAddFriendExpectation.never()
        addDuelExpectation.never()
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.sourceUserId, 'someSourceId')
            assert.equal(friendCheckInput.targetUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(1), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.targetUserId, 'someSourceId')
            assert.equal(friendCheckInput.sourceUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(0), sinon.match('someSourceId'))
        assert.equal(result.result, 0)
    })

    it("should not add user if target user is not found", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.twice().resolves(false)
        userRepoGetUserExpectation.twice()
        userRepoGetUserExpectation.onCall(0).resolves({ found: true, name: 'sourceUserName' })
        userRepoGetUserExpectation.onCall(1).resolves({ found: false })
        userRepoAddFriendExpectation.never()
        addDuelExpectation.never()
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.sourceUserId, 'someSourceId')
            assert.equal(friendCheckInput.targetUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(1), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.targetUserId, 'someSourceId')
            assert.equal(friendCheckInput.sourceUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(0), sinon.match('someSourceId'))
        assert.equal(result.result, 0)
    })

    it("should report if repository fails to handle errors while adding friends", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')
        let userRepoGetUserExpectation = userRepositoryMock.expects('getUser')
        let userRepoAddFriendExpectation = userRepositoryMock.expects('addFriend')
        let addDuelExpectation = challengeRepositoryMock.expects('addDuel')
        userRepoFriendCheckExpectation.twice().resolves(false)
        userRepoGetUserExpectation.twice()
        userRepoGetUserExpectation.onCall(0).resolves({ found: true, name: 'sourceUserName' })
        userRepoGetUserExpectation.onCall(1).resolves({ found: true, name: 'targetUserName' })
        userRepoAddFriendExpectation.once().rejects({ error: "mock error" })
        addDuelExpectation.never()
        const result = await userService.addFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId'
        })
        userRepoFriendCheckExpectation.verify()
        userRepoGetUserExpectation.verify()
        userRepoAddFriendExpectation.verify()
        addDuelExpectation.verify()
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(0), sinon.match('someSourceId'))
        sinon.assert.calledWith(userRepoGetUserExpectation.getCall(1), sinon.match('someTargetId'))
        sinon.assert.calledWith(userRepoAddFriendExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.targetFriendName, 'targetUserName')
            assert.equal(friendRequest.status, 'awaiting')
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.sourceUserId, 'someSourceId')
            assert.equal(friendCheckInput.targetUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(1), sinon.match((friendCheckInput) => {
            assert.equal(friendCheckInput.targetUserId, 'someSourceId')
            assert.equal(friendCheckInput.sourceUserId, 'someTargetId')
            assert.notExists(friendCheckInput.targetFriendName)
            assert.notExists(friendCheckInput.status)
            return true
        }))
        assert.equal(result.result, -1)
    })

    it("isFriend: should check if users are friends", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')

        userRepoFriendCheckExpectation.once().resolves(true)

        const result = await userService.isFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId',
            junk: 'not to be passed down'
        })
        userRepoFriendCheckExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.notExists(friendRequest.junk)
            return true
        }))
        assert.isTrue(result)
    })

    it("isFriend:should handle if repository fails", async function () {
        let userRepoFriendCheckExpectation = userRepositoryMock.expects('isFriend')

        userRepoFriendCheckExpectation.once().rejects({ exception: 'failure' })

        const result = await userService.isFriend({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId',
            junk: 'not to be passed down'
        })
        userRepoFriendCheckExpectation.verify()
        sinon.assert.calledWith(userRepoFriendCheckExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.notExists(friendRequest.junk)
            return true
        }))
        assert.isFalse(result)
    })

    it("should update friend status successfully", async function () {
        let userRepoFriendUpdateStatusExpectation = userRepositoryMock.expects('updateFriendStatus')
        userRepoFriendUpdateStatusExpectation.twice().resolves(true)
        const result = await userService.updateFriendStatus({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId',
            status: 'someStatus',
            junk: 'not to be passed down'
        })
        assert.equal(result.result, 1)
        assert.equal(result.message, 'friend status updated')
        userRepoFriendUpdateStatusExpectation.verify()
        sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.status, 'someStatus')
            assert.notExists(friendRequest.junk)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(1), sinon.match((friendRequest) => {
            assert.equal(friendRequest.targetUserId, 'someSourceId')
            assert.equal(friendRequest.sourceUserId, 'someTargetId')
            assert.equal(friendRequest.status, 'someStatus')
            assert.notExists(friendRequest.junk)
            return true
        }))
    })

    it("should report failure if friend status first update fails gracefully", async function () {
        let userRepoFriendUpdateStatusExpectation = userRepositoryMock.expects('updateFriendStatus')
        userRepoFriendUpdateStatusExpectation.once().resolves(false)
        const result = await userService.updateFriendStatus({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId',
            status: 'someStatus',
            junk: 'not to be passed down'
        })
        assert.equal(result.result, -1)
        assert.equal(result.message, 'error in repository')
        userRepoFriendUpdateStatusExpectation.verify()
        sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.status, 'someStatus')
            assert.notExists(friendRequest.junk)
            return true
        }))
        // sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(1), sinon.match((friendRequest) => {
        //     assert.equal(friendRequest.targetUserId, 'someSourceId')
        //     assert.equal(friendRequest.sourceUserId, 'someTargetId')
        //     assert.equal(friendRequest.status, 'someStatus')
        //     assert.notExists(friendRequest.junk)
        //     return true
        // }))
    })

    it("should report failure if friend status second update fails gracefully", async function () {
        let userRepoFriendUpdateStatusExpectation = userRepositoryMock.expects('updateFriendStatus')
        userRepoFriendUpdateStatusExpectation.twice()
        userRepoFriendUpdateStatusExpectation.onCall(0).resolves(true)
        userRepoFriendUpdateStatusExpectation.onCall(1).resolves(false)
        const result = await userService.updateFriendStatus({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId',
            status: 'someStatus',
            junk: 'not to be passed down'
        })
        assert.equal(result.result, -1)
        assert.equal(result.message, 'error in repository')
        userRepoFriendUpdateStatusExpectation.verify()
        sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.status, 'someStatus')
            assert.notExists(friendRequest.junk)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(1), sinon.match((friendRequest) => {
            assert.equal(friendRequest.targetUserId, 'someSourceId')
            assert.equal(friendRequest.sourceUserId, 'someTargetId')
            assert.equal(friendRequest.status, 'someStatus')
            assert.notExists(friendRequest.junk)
            return true
        }))
    })

    it("should report failure if first update is failed unexpected in repository", async function () {
        let userRepoFriendUpdateStatusExpectation = userRepositoryMock.expects('updateFriendStatus')
        userRepoFriendUpdateStatusExpectation.once().rejects({ error: 'mock error' })
        const result = await userService.updateFriendStatus({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId',
            status: 'someStatus',
            junk: 'not to be passed down'
        })
        assert.equal(result.result, -1)
        assert.equal(result.message, 'error in repository')
        userRepoFriendUpdateStatusExpectation.verify()
        sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.status, 'someStatus')
            assert.notExists(friendRequest.junk)
            return true
        }))
    })

    it("should report failure if reverse update fails unexpected in repository", async function () {
        let userRepoFriendUpdateStatusExpectation = userRepositoryMock.expects('updateFriendStatus')
        userRepoFriendUpdateStatusExpectation.twice()
        userRepoFriendUpdateStatusExpectation.onCall(0).resolves(true)
        userRepoFriendUpdateStatusExpectation.onCall(1).rejects({ error: 'mock error' })
        const result = await userService.updateFriendStatus({
            sourceUserId: 'someSourceId',
            targetUserId: 'someTargetId',
            status: 'someStatus',
            junk: 'not to be passed down'
        })
        assert.equal(result.result, -1)
        assert.equal(result.message, 'error in repository')
        userRepoFriendUpdateStatusExpectation.verify()
        sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(0), sinon.match((friendRequest) => {
            assert.equal(friendRequest.sourceUserId, 'someSourceId')
            assert.equal(friendRequest.targetUserId, 'someTargetId')
            assert.equal(friendRequest.status, 'someStatus')
            assert.notExists(friendRequest.junk)
            return true
        }))
        sinon.assert.calledWith(userRepoFriendUpdateStatusExpectation.getCall(1), sinon.match((friendRequest) => {
            assert.equal(friendRequest.targetUserId, 'someSourceId')
            assert.equal(friendRequest.sourceUserId, 'someTargetId')
            assert.equal(friendRequest.status, 'someStatus')
            assert.notExists(friendRequest.junk)
            return true
        }))
    })

    it("should list all confirmed friends", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('friendsWithStatus')
        userRepoFriendSearchExpectation.once().resolves({
            errorCode: 1,
            friends: [{ id: 1, name: "nameOne" }, { id: 2, name: "nameTwo" }]
        })
        const result = await userService.listOfFriendsByStatus({
            sourceUserId: "someSourceUserId", status: "confirmed"
        })
        userRepoFriendSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match((searchRequest) => {
            assert.equal(searchRequest.sourceUserId, "someSourceUserId")
            assert.equal(searchRequest.status, "confirmed")
            return true
        }))
        assert.equal(result.result, 1)
        assert.equal(result.friends.length, 2)
        assert.equal(result.friends[0].id, 1)
        assert.equal(result.friends[1].id, 2)
        assert.equal(result.friends[0].name, 'nameOne')
        assert.equal(result.friends[1].name, 'nameTwo')
    })

    it("should handle graceful error scenario from repository while searching confirmed friends", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('friendsWithStatus')
        userRepoFriendSearchExpectation.once().resolves({
            errorCode: -1
        })
        const result = await userService.listOfFriendsByStatus({
            sourceUserId: "someSourceUserId", status: "confirmed"
        })
        userRepoFriendSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match((searchRequest) => {
            assert.equal(searchRequest.sourceUserId, "someSourceUserId")
            assert.equal(searchRequest.status, "confirmed")
            return true
        }))
        assert.equal(result.result, -1)
        assert.notExists(result.friends)
    })

    it("should handle runtime error scenario from repository while searching confirmed friends", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('friendsWithStatus')
        userRepoFriendSearchExpectation.once().rejects({
            error: 'mock error'
        })
        const result = await userService.listOfFriendsByStatus({
            sourceUserId: "someSourceUserId", status: "confirmed"
        })
        userRepoFriendSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match((searchRequest) => {
            assert.equal(searchRequest.sourceUserId, "someSourceUserId")
            assert.equal(searchRequest.status, "confirmed")
            return true
        }))
        assert.equal(result.result, -1)
        assert.notExists(result.friends)
    })

    it("isEligibleForChallenge: should assert friend is challengeable if status is open", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'confirmed', duelId: 'someDuelId' })
        challengeRepoDuelSearchExpectation.once().resolves({ found: true, data: { status: 'open', sourceUserId: 'someOtherSourceUserId' } })
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        sinon.assert.calledWith(challengeRepoDuelSearchExpectation.getCall(0), sinon.match('someDuelId'))
        assert.isTrue(result)
    })

    it("isEligibleForChallenge: should assert friend is challengeable if status is active and source user ID matches with duel source", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'confirmed', duelId: 'someDuelId' })
        challengeRepoDuelSearchExpectation.once().resolves({ found: true, data: { status: 'active', sourceUserId: 'someSourceUserId' } })
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        sinon.assert.calledWith(challengeRepoDuelSearchExpectation.getCall(0), sinon.match('someDuelId'))
        assert.isTrue(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if status is active and source user ID does not match with duel source", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'confirmed', duelId: 'someDuelId' })
        challengeRepoDuelSearchExpectation.once().resolves({ found: true, data: { status: 'active', sourceUserId: 'someTargetUserId' } })
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        sinon.assert.calledWith(challengeRepoDuelSearchExpectation.getCall(0), sinon.match('someDuelId'))
        assert.isFalse(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if duel is not active or open", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'confirmed', duelId: 'someDuelId' })
        challengeRepoDuelSearchExpectation.once().resolves({ found: true, data: { status: 'pendingAction', sourceUserId: 'someSourceUserId' } })
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        sinon.assert.calledWith(challengeRepoDuelSearchExpectation.getCall(0), sinon.match('someDuelId'))
        assert.isFalse(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if duel is not found", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'confirmed', duelId: 'someDuelId' })
        challengeRepoDuelSearchExpectation.once().resolves({ found: false })
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        sinon.assert.calledWith(challengeRepoDuelSearchExpectation.getCall(0), sinon.match('someDuelId'))
        assert.isFalse(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if duel search rejects", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'confirmed', duelId: 'someDuelId' })
        challengeRepoDuelSearchExpectation.once().rejects({ error: 'some error' })
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        sinon.assert.calledWith(challengeRepoDuelSearchExpectation.getCall(0), sinon.match('someDuelId'))
        assert.isFalse(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if duelID is empty", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'confirmed', duelId: '' })
        challengeRepoDuelSearchExpectation.never()
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        assert.isFalse(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if duelID is not present", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'confirmed' })
        challengeRepoDuelSearchExpectation.never()
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        assert.isFalse(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if friendship is not confirmed", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: true, status: 'pending', duelId: 'someDuelId' })
        challengeRepoDuelSearchExpectation.never()
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        assert.isFalse(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if friendship is not foubd", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().resolves({ found: false })
        challengeRepoDuelSearchExpectation.never()
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        assert.isFalse(result)
    })

    it("isEligibleForChallenge: should negate friend is challengeable if friendship check is rejected by repo", async function () {
        let userRepoFriendSearchExpectation = userRepositoryMock.expects('getFriendshipDetails')
        let challengeRepoDuelSearchExpectation = challengeRepositoryMock.expects('getDuel')
        userRepoFriendSearchExpectation.once().rejects({ error: 'mock error' })
        challengeRepoDuelSearchExpectation.never()
        const result = await userService.isEligibleForChallenge('someSourceUserId', 'someTargetUserId')
        userRepoFriendSearchExpectation.verify()
        challengeRepoDuelSearchExpectation.verify()
        sinon.assert.calledWith(userRepoFriendSearchExpectation.getCall(0), sinon.match('someSourceUserId'), sinon.match('someTargetUserId'))
        assert.isFalse(result)
    })

    it("findUserByAppUserId: should find user by appUserId", async function () {
        let userRepoSearchExpectation = userRepositoryMock.expects('findUserByAppUserId')
        userRepoSearchExpectation.once().resolves({ result: 1, email: 'someEmail' })
        const result = await userService.findUserByAppUserId('someUserId')
        assert.equal(result.result, 1)
        assert.equal(result.email, 'someEmail')
        userRepoSearchExpectation.verify()
        sinon.assert.calledWith(userRepoSearchExpectation.getCall(0), sinon.match('someUserId'))
    })

    it("findUserByAppUserId: should return user not found when repo rejects", async function () {
        let userRepoSearchExpectation = userRepositoryMock.expects('findUserByAppUserId')
        userRepoSearchExpectation.once().rejects({ error: 'someError' })
        const result = await userService.findUserByAppUserId('someUserId')
        assert.equal(result.result, -1)
        userRepoSearchExpectation.verify()
        sinon.assert.calledWith(userRepoSearchExpectation.getCall(0), sinon.match('someUserId'))
    })


})