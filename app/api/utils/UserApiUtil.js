

const validateAndConvertUserCreateRequest = (req) => {

    if (!req.body) {
        return {
            valid: false
        }
    }
    var user = req.body
    if (!user.email || !user.name || !user.password || user.email === "" || user.name === "" || user.password === "") {
        return {
            valid: false
        }
    }
    return {
        valid: true,
        userInput: {
            email: user.email,
            displayName: user.name,
            password: user.password,
            disabled: false
        }
    }
}

module.exports = { validateAndConvertUserCreateRequest }