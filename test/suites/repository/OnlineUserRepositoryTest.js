const sinon = require('sinon')
const firebaseSetup = require('../../setup/AppSetup')
const { assert } = require('chai')


describe("should execute all online user repository tests", function () {

    let userRepo
    let authenticatorStub

    before(function () {
        userRepo = require('../../../app/repositories/OnlineUserRepository')
    })

    beforeEach(function () {
        authenticatorStub = sinon.stub(firebaseSetup.auth, 'createUser')
    })

    afterEach(function () {
        authenticatorStub.restore()
    })

    it('should set data', async function () {
        let expectation = authenticatorStub.resolves({ userCreate: true })
        await userRepo.createUser({ place: 'hell', displayName: 'someName', email: 'someEmail' })
        sinon.assert.calledWith(expectation.getCall(0), sinon.match((user) => {
            assert.exists(user.place)
            assert.equal('someName', user.displayName)
            assert.equal('someEmail', user.email)
            return true
        }))
        assert(expectation.calledOnce)
    })

    it('should handle failure to add data', async function () {
        let expectation = authenticatorStub.rejects("mock error")
        let err
        try {
            await userRepo.createUser({ place: 'hell', displayName: 'someName', email: 'someEmail' })
        } catch (error) {
            err = error
        }
        assert.equal('User could not be created at online repo', err.message)
        // expectation.verify()
    })

})
