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

    it("should successfully add user to authenticator and repository", async function () {
        let userRepoExpectation = userRepositoryMock.expects('addUser').once().resolves('someId')
        let onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').once().resolves({
            uid: "someUid",
            email: "someEmail",
            displayName: "someName",
            providerData: [{
                uid: "someProviderUid",
                displayName: "someProviderDisplayName",
                email: "someProviderEmail",
                providerId: "someProviderId"
            }]
        })
        await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            disabled: false
        })
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        assert.isTrue(onlineAuthenticatorExpectation.getCall(0).calledBefore(userRepoExpectation.getCall(0)))
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
    })

    it("should throw error if insertion to database fails", async function () {
        let userRepoExpectation = userRepositoryMock.expects('addUser').once().rejects('database error')
        let onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').once().resolves({
            uid: "someUid",
            email: "someEmail",
            displayName: "someName",
            providerData: [{
                uid: "someProviderUid",
                displayName: "someProviderDisplayName",
                email: "someProviderEmail",
                providerId: "someProviderId"
            }]
        })
        let repoError
        await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            disabled: false
        }).catch((error) => {
            repoError = error
        })
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        assert.isTrue(onlineAuthenticatorExpectation.getCall(0).calledBefore(userRepoExpectation.getCall(0)))
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
        assert.isDefined(repoError)
    })


    it("should not attempt to add in user repo if online repo fails", async function () {
        let userRepoExpectation = userRepositoryMock.expects('addUser').never()
        let onlineAuthenticatorExpectation = onlineUserRepositoryMock.expects('createUser').once().rejects("User exists")
        let errorReceived
        await userService.addUser({
            email: 'someEmail',
            password: 'somePassword',
            displayName: 'someName',
            disabled: false
        }).catch((error) => {
            errorReceived = error
        })
        // assert.equal('someId', challengeId)
        userRepoExpectation.verify()
        onlineAuthenticatorExpectation.verify()
        assert.isDefined(errorReceived)

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

    it("should check if users are friends", async function () {
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

    it("should handle if repository fails", async function () {
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
        const result = await userService.listOfConfirmedFriends({
            sourceUserId: "someSourceUserId"
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
        const result = await userService.listOfConfirmedFriends({
            sourceUserId: "someSourceUserId"
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
        const result = await userService.listOfConfirmedFriends({
            sourceUserId: "someSourceUserId"
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
})