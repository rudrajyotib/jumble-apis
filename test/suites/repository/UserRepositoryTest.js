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

    it('should add user', async function () {
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

    it('should handle failure to add user', async function () {
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

    it('should find a user', async function () {
        let expectation = documentDataMock.expects('get').once().resolves({
            name: 'someName',
            email: 'someEmail',
            exists: true,
            data: function () {
                return {
                    name: 'someName',
                    email: 'someEmail'
                }
            }
        })
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someId')
        assert(firestoreCollectionSpy.calledOnce)
        assert(user, sinon.match((user) => {
            assert.equal('someId', user.id)
            assert.isTrue(user.found)
            assert.equal('someName', user.name)
            assert.equal('someEmail', user.email)
        }))
    })

    it('should indicate in response when a user is not found', async function () {
        let expectation = documentDataMock.expects('get').once().resolves({
            exists: false
        })
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someId')
        assert(firestoreCollectionSpy.calledOnce)
        assert.isFalse(user.found)
    })

    it('should indicate in response when remote promise fails', async function () {
        let expectation = documentDataMock.expects('get').once().rejects('some error in remote')
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someId')
        assert(firestoreCollectionSpy.calledOnce)
        assert.isFalse(user.found)
    })

    it('should indicate in response when execution fails', async function () {
        let expectation = documentDataMock.expects('get').once().throws('some error')
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someId')
        assert(firestoreCollectionSpy.calledOnce)
        assert.isFalse(user.found)
    })

})
