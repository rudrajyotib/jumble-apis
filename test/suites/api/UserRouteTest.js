const request = require('supertest')
const sinon = require('sinon')
const assert = require('chai').assert

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

})