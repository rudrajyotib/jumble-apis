const sinon = require('sinon')
const firebaseSetup = require('../../setup/AppSetup')
const { assert } = require('chai')




describe("should execute all user repository tests", function () {

    let documentDataMock
    let userRepo
    let firestoreCollectionSpy
    let firestoreCollection
    let firestoreSpy
    let firestore


    before(function () {
        userRepo = require('../../../app/repositories/UserRepository')
        firestoreCollection = require('../../setup/AppSetup').firestoreCollection
        firestore = require('../../setup/AppSetup').firestore
    })

    beforeEach(function () {
        documentDataMock = sinon.mock(firebaseSetup.firestoreDocument)
        firestoreCollectionSpy = sinon.spy(firebaseSetup.firestoreCollection, 'doc')
        firestoreSpy = sinon.spy(firestore, 'collection')
    })

    afterEach(function () {
        documentDataMock.restore()
        firestoreCollectionSpy.restore()
        firestoreSpy.restore()
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

    it('should indicate in response when remote promise fails to find a user', async function () {
        let expectation = documentDataMock.expects('get').once().rejects('some error in remote')
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someId')
        assert(firestoreCollectionSpy.calledOnce)
        assert.isFalse(user.found)
    })

    it('should indicate in response when execution fails to find a user', async function () {
        let expectation = documentDataMock.expects('get').once().throws('some error')
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someId')
        assert(firestoreCollectionSpy.calledOnce)
        assert.isFalse(user.found)
    })

    it('should add friend', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        let documentDataSetMockExpectation = documentDataMock.expects('set')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: false })
        documentDataSetMockExpectation.once().resolves()
        await userRepo.addFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser',
            targetFriendName: 'friendName',
            status: 'someStatus'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        documentDataSetMockExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(documentDataSetMockExpectation.getCall(0), sinon.match((targetFriend) => {
            assert.equal('friendName', targetFriend.name)
            assert.equal('someStatus', targetFriend.status)
            return true
        }))
    })

    it('should not add friend if exist', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        let documentDataSetMockExpectation = documentDataMock.expects('set')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: true })
        documentDataSetMockExpectation.never()
        await userRepo.addFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser',
            targetFriendName: 'friendName',
            status: 'someStatus'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        documentDataSetMockExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
    })

    it('should assert friend entity exists', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: true })
        const friendExists = await userRepo.isFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isTrue(friendExists)
    })

    it('should negate friend entity exists', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: false })
        const friendExists = await userRepo.isFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isFalse(friendExists)
    })

    it('should negate friend entity exists when promise fails to get user', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().rejects('mock error')
        const friendExists = await userRepo.isFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isFalse(friendExists)
    })

    it('should update friend status', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataUpdateMockExpectation = documentDataMock.expects('update')
        let documentDataSetMockExpectation = documentDataMock.expects('set')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataUpdateMockExpectation.once().resolves()
        documentDataSetMockExpectation.never()
        const result = await userRepo.updateFriendStatus({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser',
            status: 'someStatus'
        })
        assert.isTrue(result)
        documentDataCollectionMockExpectation.verify()
        documentDataUpdateMockExpectation.verify()
        documentDataSetMockExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(documentDataUpdateMockExpectation.getCall(0), sinon.match((updateData) => {
            assert.equal(updateData.status, 'someStatus')
            assert.notExists(updateData.name)
            return true
        }))
    })

    it('should catch fail to update friend status', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataUpdateMockExpectation = documentDataMock.expects('update')
        let documentDataSetMockExpectation = documentDataMock.expects('set')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataUpdateMockExpectation.once().rejects({ error: 'mockError' })
        documentDataSetMockExpectation.never()
        const result = await userRepo.updateFriendStatus({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser',
            status: 'someStatus'
        })
        assert.isFalse(result)
        documentDataCollectionMockExpectation.verify()
        documentDataUpdateMockExpectation.verify()
        documentDataSetMockExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(documentDataUpdateMockExpectation.getCall(0), sinon.match((updateData) => {
            assert.equal(updateData.status, 'someStatus')
            assert.notExists(updateData.name)
            return true
        }))
    })

})
