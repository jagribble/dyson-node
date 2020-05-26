const fetch = require('node-fetch');

const BasicAuth = require('./BasicAuth');

const DYSON_API_URL = 'appapi.cp.dyson.com';

class DysonAccount{
    constructor(email, password, country = 'GB'){
        this.email = email;
        this.password = password;
        this.country = country;
        this.auth = null;
    }

    login(){
        return new Promise((resolve, reject) => {
            fetch(`https://${DYSON_API_URL}/v1/userregistration/authenticate?country=${this.country}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Email: this.email,
                    Password: this.password,
                })
            }).then(res => res.json()).then(account => {
                this.username = account.Account;
                this.appPassword = account.Password;
                this.auth = new BasicAuth(account.Account, account.Password);
                console.log(account);
                resolve(true);
            }).catch(err => {
                console.log('Error',err);
                reject(new Error(err));
                console.error(err);
            });
        });
    }

    getDevices() {
        return new Promise((resolve, reject) => {
            console.log(this.auth.getAuthHeader());
            fetch(`https://${DYSON_API_URL}/v2/provisioningservice/manifest`, {
                headers: {
                    ...this.auth.getAuthHeader()
                },
            }).then(res => {
                if(!res.ok) throw res;
                return res.json();
            }).then(devices => {
                this.devices = devices;
                resolve(devices);
            }).catch(err => {
                console.log('Error',JSON.stringify(err));
                reject(new Error(err));
                console.error(err); 
            });
        });
    }
}

module.exports = DysonAccount;