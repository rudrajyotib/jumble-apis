const isValidChallenge = (inputData) => {
    if (!inputData.sourceUserId || '' === inputData.sourceUserId) { return false }
    if (!inputData.question) { return false }
    if (!inputData.question.type || '' === inputData.question.type || !validQuestionTypes.includes(inputData.question.type, 0)) { return false }
    if (!inputData.question.content) { return false }
    if ('JUMBLE' === inputData.question.type && !isValidJumbleWord(inputData.question.content)) { return false }
    return true
}

const isValidUserCreateRequest = (inputData) => {
    if (!inputData.appUserId || '' === inputData.appUserId || inputData.appUserId.length < 5 || inputData.appUserId.length > 20 || !inputData.appUserId.match(alphaNumericRegex)) { return false }
    return true
}

const validQuestionTypes = ['JUMBLE']

const allCapsAlphaRegex = /^[A-Z]+$/;
const alphaNumericRegex = /^[A-Za-z0-9]+$/;

const isValidJumbleWord = (questionContent) => {
    if (!questionContent.word || (questionContent.word.length > 20 || (questionContent.word.length < 4))) { return false }
    if (!questionContent.word.match(allCapsAlphaRegex)) { return false }
    return true
}

module.exports = { isValidChallenge, isValidUserCreateRequest }