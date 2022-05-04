const test = require('firebase-functions-test')();
const sinon = require('sinon')
const admin = require('firebase-admin');
const firebaseSetup = require('./setup/AppSetup');
let server

describe("Should execute all APIs", function () {

    before(function () {
        admin.initializeApp()
        sinon.stub(admin, 'firestore').get(() => {
            return function () {
                return firebaseSetup.firestore
            }
        })
        sinon.stub(admin, 'auth').get(() => {
            return function () {
                return firebaseSetup.auth
            }
        })
        server = require('./suites/api/Server')
    })
    after(function () {
        server.close(() => {
            console.log("server stopped")
        })
    })
    describe('challenge api suite', function () {
        require('./suites/repository/challengeRepositoryTest')
        require('./suites/repository/UserRepositoryTest')
        require('./suites/repository/OnlineUserRepositoryTest')
        require('./suites/service/ChallengeServiceTest')
        require('./suites/service/UserServiceTest')
        require('./suites/api/ChallengeRoute')
        require('./suites/api/LoginRoute')
        require('./suites/api/util/UserApiUtilTest')
        require('./suites/config/ConfigurationTest')
    })
})