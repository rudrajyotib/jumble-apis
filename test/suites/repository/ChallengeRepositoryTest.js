const sinon = require('sinon')
const firebaseSetup = require('../../setup/AppSetup')
const { assert } = require('chai')




describe("should execute all challenge repository tests", function () {

    let documentDataMock
    let firestoreCollectionSpy
    let challengeRepo

    before(function () {
        challengeRepo = require('../../../app/repositories/ChallengeRepository')
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
        await challengeRepo.addChallenge({ place: 'hell' })
        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match.has('place'))
        assert(firestoreCollectionSpy.calledOnce)
    })

    it('should handle failure to add data', async function () {
        let expectation = documentDataMock.expects('set').once().rejects(new Error('could not add challenge'))
        let err
        try {
            await challengeRepo.addChallenge()
        } catch (error) {
            err = error
        }
        assert.equal('challenge not created', err.message)
        expectation.verify()
    })

})
