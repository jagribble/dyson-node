class BasicAuth {
    constructor(usernmae, password){
        this.username = usernmae;
        this.password = password;
    }

    getAuthHeader() {
        const base64 = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        return {
            Authorization: `Basic ${base64}`
        }
    }
}

module.exports = BasicAuth;