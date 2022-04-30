const firestoreDocument = {
    set: async function (data) {
        console.log('called setup for real')
        throw new Error('should always be mocked')
    }
}
const firestoreCollection = {
    doc: (documentId) => {
        return firestoreDocument
    }
}
const firestore = {
    collection: (path) => {
        return firestoreCollection
    }
}


exports.firestore = firestore
exports.firestoreCollection = firestoreCollection
exports.firestoreDocument = firestoreDocument