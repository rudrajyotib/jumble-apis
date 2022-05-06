const request = require('supertest')
const sinon = require('sinon')
const assert = require('chai').assert
const chai = require('chai')

describe("should do service operations", function () {
    let userService
    let userServiceMock

    this.timeout(3000)

    before(function () {
        userService = require('../../../app/service/UserService')
    })

    beforeEach(function () {
        userServiceMock = sinon.mock(userService)
    })

    afterEach(function () {
        userServiceMock.restore()
    })

    it("should add friends and return success", async function () {
        let expectation = userServiceMock.expects('addFriend').once().resolves({
            result: 1
        })
        const response = await request("http://localhost:3000")
            .post("/user/addfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.text, "Friends created Ok")
    })

    it("should report error if service fails to add friends entity and handles it", async function () {
        let expectation = userServiceMock.expects('addFriend').once().resolves({
            result: 0,
            message: 'requestor user does not exist'
        })
        const response = await request("http://localhost:3000")
            .post("/user/addfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 400)
        assert.equal(response.text, "requestor user does not exist")
    })

    it("should report error if service fails to add friends entity because of unhandled error", async function () {
        let expectation = userServiceMock.expects('addFriend').once().resolves({
            result: -1,
            message: 'requestor user does not exist'
        })
        const response = await request("http://localhost:3000")
            .post("/user/addfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "requestor user does not exist")
    })


    it("should report error if service fails to add friends entity because of unhandled error and propagates the exception up", async function () {
        let expectation = userServiceMock.expects('addFriend').once().rejects({
            result: -1,
            message: 'requestor user does not exist'
        })
        const response = await request("http://localhost:3000")
            .post("/user/addfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "User not created due to unhandled backend error")
    })

    it("should find existence of a friend and return success", async function () {
        let expectation = userServiceMock.expects('isFriend').once().resolves(true)
        const response = await request("http://localhost:3000")
            .get("/user/isfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')
            .set('Produces', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.body.friend, true)
    })

    it("should check find existence of a friend and return success when none found", async function () {
        let expectation = userServiceMock.expects('isFriend').once().resolves(false)
        const response = await request("http://localhost:3000")
            .get("/user/isfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')
            .set('Produces', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.body.friend, false)
    })

    it("should check find existence of a friend and return success when service promise is rejected", async function () {
        let expectation = userServiceMock.expects('isFriend').once().rejects({})
        const response = await request("http://localhost:3000")
            .get("/user/isfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')
            .set('Produces', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "User not created")
    })

    it("should confirm friends and return success", async function () {
        let expectation = userServiceMock.expects('updateFriendStatus').once().resolves({
            result: 1
        })
        const response = await request("http://localhost:3000")
            .post("/user/confirmfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.equal(actual.status, 'confirmed')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.body.friendStatus, "confirmed")
    })

    it("should handle and inform if friend confirmation fails gracefully", async function () {
        let expectation = userServiceMock.expects('updateFriendStatus').once().resolves({
            result: -1
        })
        const response = await request("http://localhost:3000")
            .post("/user/confirmfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.equal(actual.status, 'confirmed')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 400)
        assert.equal(response.text, "update failed")
    })

    it("should handle and inform if friend confirmation service throws unexpected", async function () {
        let expectation = userServiceMock.expects('updateFriendStatus').once().rejects({
            error: 'mock error'
        })
        const response = await request("http://localhost:3000")
            .post("/user/confirmfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.equal(actual.status, 'confirmed')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "update failed")
    })

    it("should get list of friends and return", async function () {
        let serviceExpectation = userServiceMock.expects('listOfConfirmedFriends').once().resolves({
            result: 1,
            friends: [{ id: 1, name: 'nameOne' }, { id: 2, name: 'nameTwo' }]
        })
        const response = await request("http://localhost:3000")
            .get("/user/friends/someUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someUserId')
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.length, 2)
        assert.equal(response.body[0].id, 1)
        assert.equal(response.body[1].id, 2)
        assert.equal(response.body[0].name, 'nameOne')
        assert.equal(response.body[1].name, 'nameTwo')
    })

    it("should report service fails to list friends gracefully", async function () {
        let serviceExpectation = userServiceMock.expects('listOfConfirmedFriends').once()
            .resolves({
                result: -1
            })
        const response = await request("http://localhost:3000")
            .get("/user/friends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("should report when no friends found", async function () {
        let serviceExpectation = userServiceMock.expects('listOfConfirmedFriends').once()
            .resolves({
                result: 1
            })
        const response = await request("http://localhost:3000")
            .get("/user/friends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            return true
        }, "does not match"))
        assert.equal(response.status, 204)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("should report when service fails brute to list friends", async function () {
        let serviceExpectation = userServiceMock.expects('listOfConfirmedFriends').once()
            .rejects({
                error: 'mock error'
            })
        const response = await request("http://localhost:3000")
            .get("/user/friends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        assert.equal(response.text, 'no result')
    })

})