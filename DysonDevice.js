const crypto = require('crypto');
const mqtt = require('mqtt');
const { DysonFanState } = require('./DysonFanState');
const { DysonEnvironmentState } = require('./DysonEnvironment');



function decryptPassword(encrypted) {
    crypto.randomBytes(32).toString('hex');
    const ENC_KEY = Buffer.from(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'])
    const IV = Buffer.from(['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'])
    let decipher = crypto.createDecipheriv('aes-256-cbc', ENC_KEY, IV);
    // let decipher = crypto.createDecipheriv('aes-128-gcm', ENC_KEY, IV);
    let decrypted = decipher.update(encrypted, 'base64', 'utf-8');
    decrypted += decipher.final('utf-8');
    const json = JSON.parse(decrypted);
    return (json.apPasswordHash);
}

class DysonDevice {
    constructor({
        Active = false,
        Serial = '', 
        Name,
        Version,
        LocalCredentials,
        AutoUpdate,
        NewVersionAvailable,
        ProductType,
        ConnectionType },
        updatedCallback = () => { },
        updateEnvironmentCallback = () => { },
        deviceIP = false) {
        this.active = Active;
        this.serial = Serial;
        this.name = Name;
        this.version = Version;
        this.credentials = decryptPassword(LocalCredentials);
        this.autoUpdate = AutoUpdate;
        this.newVersionAvailable = NewVersionAvailable;
        this.productType = ProductType;
        this.connectionType = ConnectionType;
        this.deviceIP = deviceIP;
        if (this.deviceIP) {
            this.connectManually(this.name, this.deviceIP);
        }
        this.updatedCallback = updatedCallback;
        this.updateEnvironmentCallback = updateEnvironmentCallback;
        // self._credentials = decrypt_password(json_body['LocalCredentials'])
    }

    async autoConnect() {
        return new Promise((resolve) => {
            const serialLocal = `${this.serial}.local`;
            const self = this;
            const mdns = require('multicast-dns')({ loopback: true });
            let timeout = null;
            mdns.on('response', async (response) => {
                if (response.answers.length > 0) {
                    const answer = response.answers.find(a => a.name === serialLocal);
                    if (answer) {
                        // If correct answer then destroy the MDNS UDP socket
                        mdns.destroy();
                        self.deviceIP = answer.data;
                        clearTimeout(timeout);
                        await self.connectManually(this.serial, self.deviceIP);
                        resolve();
                    }
                }
            });
            mdns.query({
                questions: [{
                    name: `${this.serial}.local`,
                    type: 'A'
                }]
            });
            // If it is timeout after 2 mins then destroy
            timeout = setTimeout(() => {
                mdns.destroy();
                throw new Error(`Device '${name}' timedout afte 2 mins`);
            }, 120000); 
        });
    }

    async connectManually(name, deviceIP, devicePort = 1883) {
        return new Promise((resolve, reject) => {
            this.deviceIP = deviceIP;
            this.name = name;
            const options = {
                username: this.serial,
                password: this.credentials,
            };

            if (this.productType === '438' || this.productType === '520') {
                options.protocolVersion = 3;
                options.protocolId = 'MQIsdp';
            }
            this.client = mqtt.connect(`mqtt://${deviceIP}`, options);

            this.statusSubscribeTopic = `${this.productType}/${this.serial}/status/current`;
            this.commandTopic = `${this.productType}/${this.serial}/command`;

            this.fanState = new DysonFanState(this.heatAvailable, this.Is2018Dyson);
            this.environment = new DysonEnvironmentState();

            this.client.on('connect', () => {
                console.log("Connected to " + this.serial + ". subscribe now");
                this.client.subscribe(this.statusSubscribeTopic);
                this.requestCurrentData();
            });

            this.client.on('message', (topic, message) => {
                let result = JSON.parse(message);
                switch (result.msg) {
                    case "ENVIRONMENTAL-CURRENT-SENSOR-DATA":
                        console.log('Update sensor data from ENVIRONMENTAL-CURRENT-SENSOR-DATA - ', this.serial);
                        this.environment.updateState(result);
                        this.updateEnvironmentCallback(this.environment);
                        break;
                    case "CURRENT-STATE":
                        console.log('Update fan data from CURRENT-STATE - ', this.serial);
                        this.fanState.updateState(result);
                        this.updatedCallback(this.fanState);
                        resolve();
                        break;
                    case "STATE-CHANGE":
                        console.log('STATE-CHANGE detected, request update -', this.serial);
                        this.requestCurrentData();
                        break;
                }
            });

            this.client.on('error', (err) => {
                console.log(err);
                reject();
            });
        });
    }

    requestCurrentData() {
        let currentTime = new Date();
        this.client.publish(this.commandTopic, JSON.stringify({
            msg: 'REQUEST-CURRENT-STATE',
            time: currentTime.toISOString()
        }));
    }

    setFanSpeed(speed) {
        const data = { fnsp: Math.round(speed / 10).toString() };
        this._publishMessage(data);
    }

    setAuto() {
        let data = { auto: "ON" };
        if (this.fanState._auto) {
            data = { auto: "OFF" };
        }
        this._publishMessage(data);
    }

    setHeatMode(force = false) {
        let data = { hmod: "HEAT" };
        if (this.fanState._heat && !force) {
            data = { hmod: "OFF", fmod: "FAN" };
        }
        this._publishMessage(data);
    }

    setFanOff() {
        const data = { fpwr: "OFF" };
        this._publishMessage(data);
    }

    setFanOn() {
        const data = { fpwr: "ON" };
        this._publishMessage(data);
    }

    setFanFocused() {
        let data = { fdir: "ON" };
        if (this.Is2018Dyson) {
            data = { fdir: !this.fanState._focus ? "ON" : "OFF" };
        } else {
            data = { ffoc: !this.fanState._focus ? "ON" : "OFF" };
        }
        this._publishMessage(data);
    }

    setNightMode() {
        let data = { nmod: "ON" };
        if (this.fanState.nightMode) {
            data = { nmod: "OFF" };
        }
        this._publishMessage(data);
    }

    setRotate() {
        const data = { oson: !this.fanState._rotate ? "ON" : "OFF" }
        this._publishMessage(data);
    }

    setHeatThreshold(celcius) {
        const kelvin = (celcius + 273) * 10;
        const data = { hmax: kelvin.toString() };
        this._publishMessage(data);
        this.setHeatMode(true);
    }

    _publishMessage(data) {
        let currentTime = new Date();
        let message = { msg: "STATE-SET", time: currentTime.toISOString(), data };
        this.client.publish(this.commandTopic, JSON.stringify(message));
    }

    heatAvailable() { return this.productType === "455" || this.productType === "527"; }
    Is2018Dyson() { return this.productType === "438" || this.productType === "520" || this.productType === "527"; }

}

module.exports = DysonDevice;