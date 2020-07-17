# dyson-node
[![npm version](https://badge.fury.io/js/dyson-node.svg)](https://badge.fury.io/js/dyson-node)
![Node.js Package](https://github.com/jagribble/dyson-node/workflows/Node.js%20Package/badge.svg)

A library for connecting to dyson fans

# Installation
```
npm install --save dyson-node
```

# Usage
> To use the dyson node package you will need to first have a dyson link account. For an account you can sign up [here](https://www.dyson.co.uk/your-dyson.html) or signup through the dyson link application for [Google Play](https://play.google.com/store/apps/details?id=com.dyson.mobile.android&hl=en_GB) and [Apple App Store](https://apps.apple.com/gb/app/dyson-link/id993135524).

## Account
Before you can control the devices you will need to first sign in to your account so that you can access your devices.

```js
const { DysonAccount } = require('dyson-node');

const account = new DysonAccount(process.env.DYSON_EMAIL,process.env.DYSON_PASSWORD);

account.login().then(() => {
  account.getDevices().then(async devices => {
      console.log(devices);
  }).catch(err => console.error(err));
}).catch(err => console.error(err));
```
This can also be done using async/await instead of traditional promises.

```js
async function asyncStart(){
  const account = new DysonAccount(process.env.DYSON_EMAIL,process.env.DYSON_PASSWORD);
  await account.login();
  const devices = await account.getDevices();
  console.log(devices);
}

asyncStart();
```

## Device
Once you have a list of devices you will be able to create a device object and start controlling the device.

```js
const { DysonAccount, DysonDevice } = require('dyson-node');

// ...
const devices = await account.getDevices();
const device = new DysonDevice(devices[0]);
// ...
```

To get notified when the device or environment updates you can pass in callbacks that will get called when this information is updated.

```js
function fanStateCallback(data) {
    console.log('Fan state', data);
}

function environmentCallback(data){ 
    console.log('Environment state', data);
}

const device = new DysonDevice(devices[0], fanStateCallback, environmentCallback);
```

There are two methods of connecting the device `autoConnect` and `connectManually`. `autoConnect` uses [mdsn](https://www.npmjs.com/package/multicast-dns) to search the devices network for the local record for the serial number of the device. After you have connected to the device you can use the device methods to control it.

### `device.autoConnect()`
---
Connect to the device automaticly using mdsn.

### `device.connectManually(name: string, deviceIP: string)`
---
Connect to the device using a manual known IP address. 

### `device.requestCurrentData()`
---
Make a request for the current data. This will send a MQTT message to the device requesting the fan state and environment state. To get the state values you will need to pass in a callback to the constructor of the device (mentioned above).

### `device.setFanSpeed(speed: number)`
---
Set the fan speed percentage. Minimum value 0. Maximum value 100.

### `device.setAuto()`
---
Set the device to Auto mode. If it is alrready on auto mode it will toggle it off.

### `device.setHeatMode(force: boolean?)`
---
Turn the heat mode on. If the heat mode is already on then it will be toggled off. If you pass in the force flag then heat mode will be set on regardless of what state the current heat mode is.

### `device.setFanOff()`
---
Turn the fan off.

### `device.setFanOn()`
---
Turn the fan on.

### `device.setFanFocused()`
---
Set the fan to focused mode. If the fan is already in focused mode then this will toggle off.

### `device.setNightMode()`
---
Set the fan to night mode. If the fan is already in night mode then this will toggle off.

### `device.setRotate()`
---
Set the fan to rotate. If the fan is already rotating then this will toggle off. Currently there is not a way to pass in the angle to rotate. 

### `device.setHeatThreshold(celcius: number)`
---
Set the heat threshold for the device. This will also turn on heat mode.

## Example code

```js
const { DysonAccount, DysonDevice } = require('dyson-node');

const account = new DysonAccount(process.env.DYSON_EMAIL,process.env.DYSON_PASSWORD);

account.login().then(() => {
    account.getDevices().then(async devices => {
        const device = new DysonDevice(devices[0]);
        await device.autoConnect();
        // If on heat mode then turn off heat mode
        if(device.fanState._heat){
            device.setHeatMode();
        }
        // Set fan speed to 50%
        device.setFanSpeed(50);
    }).catch(err => console.error(err));
}).catch(err => console.error(err));
```
## Current supported decvices
- HP04
> Note: Although this should work for most 2018 dyson fans it has not been tested. Feel free to make a PR to add support for another device.

## Credits
As there is no offical documentation on the dyson API the following repositories helped in understanding and setting up how it works
- [homebridge-dyson-link](https://github.com/joe-ng/homebridge-dyson-link/tree/c43614ed41be75e9a09965bea517a0d2317b678b)
- [libpurecoollink](https://github.com/CharlesBlonde/libpurecoollink)
