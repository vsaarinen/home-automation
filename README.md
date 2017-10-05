# A Node.js home automation server written in TypeScript

This server stores sensor measurements and controls lights (and other devices) based on certain criteria.
It also allows for remote control of lights via an HTTP request. Data is stored in InfluxDB.

Lights are connected to [cheap radio-controlled plugs](http://www.clasohlson.com/fi/Kaukokytkinsarja-3-kpl-Nexa-PE-3/36-4602) that are controlled
by a TellStick Net. A Raspberry Pi is set up with a [Homebridge](https://github.com/nfarina/homebridge) server +
[custom plugin](https://github.com/vsaarinen/homebridge-lights) and [Snips](https://snips.ai/) to be able to control and query lights via voice commands, HomeKit and Siri.

Light, temperature, humidity and pressure data comes from [sensors](sensors/) on an [Electric Imp](https://www.sparkfun.com/products/11395).
Data about whether someone is home comes from [Locative](https://www.locative.io/).

## Use cases

- Automatically turn on lights when someone is home
- Automatically turn off lights when no-one is home
- Control lights using Siri and iOS devices
- Automatically turn on external lights when the sun sets and turn them off at sunrise
- Store time-series data about temperature, humidity, light level, and air pressure

## Setup

```shell
$ brew install influxdb
$ npm install
```

Either set up InfluxDB to automatically start with `brew services start influxdb` or start it manually with:

```shell
$ influxd -config /usr/local/etc/influxdb.conf
```

Once InfluxDB is running, start a development server with:

```shell
$ export TELLDUS_PUBLIC_KEY="XXX"
$ export TELLDUS_PRIVATE_KEY="XXX"
$ export TELLDUS_TOKEN="XXX"
$ export TELLDUS_SECRET_TOKEN="XXX"
$ export LATITUDE="1.234567"
$ export LONGTITUDE="5.433211"
$ PORT=8080 npm start
```

To enable Siri integration, install Homebridge on a computer that's on your local network
(`npm i -g homebridge`), fetch the [homebridge-lights](https://github.com/vsaarinen/homebridge-lights)
plugin into the current folder and start it by running the following command:

```shell
DEBUG=* homebridge -D -P ./homebridge-lights/
```

## Production build

Compile the project as JavaScript into `dist/`:

```shell
$ npm run dist
```

## Environment variables

- **TELLDUS_PUBLIC_KEY**, **TELLDUS_PRIVATE_KEY**, **TELLDUS_TOKEN**, **TELLDUS_SECRET_TOKEN**: Your private Telldus API credentials to control the TellStick Net.
- **LONGTITUDE**: Your location's longtitude (required). Used to calculate sunset/sunrise.
- **LATITUDE**: Your location's latitude (required). Used to calculate sunset/sunrise.
- **PORT**: The port that the server should run on. Defaults to 8080.
