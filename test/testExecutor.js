const test = require('firebase-functions-test')();
const sinon = require('sinon')
const admin = require('firebase-admin');
const firebaseSetup = require('./setup/AppSetup');
// const challengeRepo = require('./suites/challengeRepositoryTest')


describe("Should execute all APIs", function () {

    before(function () {
        admin.initializeApp()
        sinon.stub(admin, 'firestore').get(() => {
            return function () {
                return firebaseSetup.firestore
            }
        })
    })
    describe('challenge api suite', function () {
        require('./suites/repository/challengeRepositoryTest')
        require('./suites/service/ChallengeServiceTest')
        require('./suites/api/ChallengeRoute')
        require('./suites/config/ConfigurationTest')
    })
    // describe('challenge service suite', function () {
    //     require('./suites/service/ChallengeServiceTest')
    // })
    //require('./suites/challengeRepositoryTest')
})