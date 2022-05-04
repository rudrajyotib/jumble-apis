const sinon = require('sinon')
const { assert } = require('chai')

describe("should operate user operations", function () {

    let userService
    let userRepositoryMock
    let onlineUserRepositoryMock
    let userRepo
    let onlineUserRepo

    before(function () {
        userService = require('../../../app/service/UserService')
        userRepo = require('../../../app/repositories/UserRepository')
        onlineUserRepo = require('../../../app/repositories/OnlineUserRepository')
    })

    beforeEach(function () {
        userRepositoryMock = sinon.mock(userRepo)
        onlineUserRepositoryMock = sinon.mock(onlineUserRepo)
    })

    afterEach(function () {
        userRepositoryMock.restore()
        onlineUserRepositoryMock.restore()
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

    it("should throw error if insertion to database failse", async function () {
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



})