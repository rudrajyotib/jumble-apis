const { assert } = require('chai')
const serviceUtil = require('../../../app/service/util/ServiceUtil')

describe("should test all the utilities", function () {

    it("should negate validity if source is not defined", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ noSourceData: 'someNoSource' }))
    })

    it("should negate validity if source is empty", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ noSourceData: 'someNoSource', sourceUserId: '' }))
    })

    it("should negate validity if question is not present", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId' }))
    })

    it("should negate validity if question type not present", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: {} }))
    })

    it("should negate validity if question type is empty", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: '' } }))
    })

    it("should negate validity if question type is not one of the valid types", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'XYZ' } }))
    })

    it("should negate validity if question content is not there", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE' } }))
    })

    it("should negate validity if JUMBLE word is not present", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE', content: {} } }))
    })

    it("should negate validity if JUMBLE word is empty", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE', content: { word: '' } } }))
    })

    it("should negate validity if JUMBLE word is longer than 20 words", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE', content: { word: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' } } }))
    })

    it("should negate validity if JUMBLE word is shorter than 4 words", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE', content: { word: 'AAA' } } }))
    })

    it("should negate validity if JUMBLE has non-alpha characters", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE', content: { word: 'AAA AA' } } }))
    })

    it("should negate validity if JUMBLE has numeric characters", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE', content: { word: 'AAA1AA' } } }))
    })

    it("should negate validity if JUMBLE has lower case characters", function () {
        assert.isFalse(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE', content: { word: 'AAAbAA' } } }))
    })

    it("should assert a valid JUMBLE question", function () {
        assert.isTrue(serviceUtil.isValidChallenge({ sourceUserId: 'someSourceUserId', question: { type: 'JUMBLE', content: { word: 'ABCDE' } } }))
    })

    it("should not validate user data if appUserData is not present", function () {
        assert.isFalse(serviceUtil.isValidUserCreateRequest({ emaill: 'someEmail' }))
    })

    it("should not validate user data if appUserData is empty", function () {
        assert.isFalse(serviceUtil.isValidUserCreateRequest({ emaill: '' }))
    })

    it("should not validate user data if appUserData is short", function () {
        assert.isFalse(serviceUtil.isValidUserCreateRequest({ emaill: 'Aa1' }))
    })

    it("should not validate user data if appUserData is long", function () {
        assert.isFalse(serviceUtil.isValidUserCreateRequest({ emaill: 'Aa1aa12hgshdyewtyghajgddafetgwevdvdg' }))
    })

    it("should not validate user data if appUserData contains special character", function () {
        assert.isFalse(serviceUtil.isValidUserCreateRequest({ emaill: 'aaa !22 ' }))
    })

    it("should  validate user data  ", function () {
        assert.isFalse(serviceUtil.isValidUserCreateRequest({ emaill: 'A1aA2aq1' }))
    })

})
