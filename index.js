const fetch = require('node-fetch');

const DYSON_API_URL = 'appapi.cp.dyson.com';

class DysonAccount{
    constructor(email, password, country = 'GB'){
        this.email = email;
        this.password = password;
        this.country = country;
    }

    login(){
        fetch(`https://${DYSON_API_URL}/v1/userregistration/authenticate?country=${this.country}`, {
            method: 'POST',
            body: JSON.stringify({
                Email: this.email,
                Password: this.password,
            })
        }).then(account => {
            console.log(account);
        }).catch(err => {
            console.error(err);
        });
    }
}

module.exports = DysonAccount;