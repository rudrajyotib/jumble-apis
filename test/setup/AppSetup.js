const firestoreDocument = {
    set: async function (data) {
        console.log('called setup for real')
        throw new Error('should always be mocked')
    },
    get: async function (data) {
        console.log('called setup for real')
        throw new Error('should always be mocked')
    },
    collection: function (data) {
        console.log('called setup for real')
        throw new Error('should always be mocked')
    },
    update: function (data) {
        console.log('called setup for real')
        throw new Error('should always be mocked')
    }
}
const querySnapshot = {
    get: async function (data) {
        console.log('called setup for real')
        throw new Error('should always be mocked')
    }
}
const firestoreCollection = {
    doc: (documentId) => {
        return firestoreDocument
    },
    where: (...args) => {
        console.log('called where for real')
        throw new Error('should always be mocked')
    }
}
const firestore = {
    collection: (path) => {
        return firestoreCollection
    }
}

const authenticator = {
    createUser: async function (user) {
        console.log('called setup for real')
        throw new Error('should always be mocked')
    }
}

exports.firestore = firestore
exports.firestoreCollection = firestoreCollection
exports.firestoreDocument = firestoreDocument
exports.querySnapshot = querySnapshot
exports.auth = authenticator