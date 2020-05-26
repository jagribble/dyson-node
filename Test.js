const dotenv = require('dotenv');
const DysonAccount = require('./DysonAccount');
const DysonDevice = require('./DysonDevice');

dotenv.config();

const account = new DysonAccount(process.env.DYSON_EMAIL,process.env.DYSON_PASSWORD);

function delay(t, val) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(val);
        }, t);
    });
 }

account.login().then(() => {
    account.getDevices().then(async devices => {
        console.log('Devices ',devices);
        const device = new DysonDevice(devices[0]);
        console.log('--------------')
        // device.autoConnect();
        await device.connectManually('Test', '10.0.5.75');
        if(device.fanState._heat){
            device.setHeatMode();
        }
        // device.setFanSpeed(50);
        // await delay(5000);
        // device.setHeatMode();
        // await delay(5000);
        // device.setHeatMode();
        // device.setFanSpeed(100);
        // await delay(5000);
        // device.setFanSpeed(10);
        // await delay(5000);
        // device.setHeatThreshold(15);
        // await delay(5000);
        // device.setFanOff();
        // await delay(5000);
        // device.setFanOn();
        // await delay(5000);
        // device.setNightMode();
        // await delay(5000);
        // device.setNightMode();
        device.setFanFocused();
    }).catch(err => console.error(err));
}).catch(err => console.error(err));