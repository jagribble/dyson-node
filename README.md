# dyson-node
A library for connecting to dyson fans

```js
const dotenv = require('dotenv');
const {DysonAccount, DysonDevice } = require('dyson-node');

dotenv.config();

const account = new DysonAccount(process.env.DYSON_EMAIL,process.env.DYSON_PASSWORD);


account.login().then(() => {
    account.getDevices().then(async devices => {
        const device = new DysonDevice(devices[0]);
        await device.connectManually(devices[0].name, '10.0.5.75');
        // If on heat mode then turn off heat mode
        if(device.fanState._heat){
            device.setHeatMode();
        }
        // Set fan speed to 50%
        device.setFanSpeed(50);
    }).catch(err => console.error(err));
}).catch(err => console.error(err));
```
