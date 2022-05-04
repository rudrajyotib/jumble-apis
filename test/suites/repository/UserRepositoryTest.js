const sinon = require('sinon')
const firebaseSetup = require('../../setup/AppSetup')
const { assert } = require('chai')




describe("should execute all user repository tests", function () {

    let documentDataMock
    let userRepo
    let firestoreCollectionSpy

    before(function () {
        userRepo = require('../../../app/repositories/UserRepository')
    })

    beforeEach(function () {
        documentDataMock = sinon.mock(firebaseSetup.firestoreDocument)
        firestoreCollectionSpy = sinon.spy(firebaseSetup.firestoreCollection, 'doc')
    })

    afterEach(function () {
        documentDataMock.restore()
        firestoreCollectionSpy.restore()
    })

    it('should set data', async function () {
        let expectation = documentDataMock.expects('set').once().resolves()
        await userRepo.addUser({ place: 'hell', name: 'someName', email: 'someEmail' })
        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match((user) => {
            assert.notExists(user.place)
            assert.equal('someName', user.name)
            assert.equal('someEmail', user.email)
            return true
        }))
        assert(firestoreCollectionSpy.calledOnce)
    })

    it('should handle failure to add data', async function () {
        let expectation = documentDataMock.expects('set').once().rejects(new Error('could not add challenge'))
        let err
        try {
            await userRepo.addUser({ place: 'hell' })
        } catch (error) {
            err = error
        }
        assert.equal('User could not be added to repository', err.message)
        expectation.verify()
    })

})
