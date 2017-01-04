# A Node.js home automation server written in TypeScript

This server stores sensor measurements and controls lights (and other devices) based on certain criteria.
It also allows for remote control of lights via an HTTP request. Data is stored in InfluxDB.

Lights are controlled via [cheap radio-controlled plugs](http://www.clasohlson.com/fi/Kaukokytkinsarja-3-kpl-Nexa-PE-3/36-4602).
The remote control for these has been rewired to take commands from a [Particle](https://www.particle.io/products/hardware/photon-wifi-dev-kit)
Spark Core. A [Homebridge](https://github.com/nfarina/homebridge) server is set up with a [custom plugin](homebridge-lights/)
to be able to control and query lights via HomeKit and Siri.

Light, temperature and pressure data comes from an [Electric Imp](https://www.sparkfun.com/products/11395).
Data about whether someone is home comes from [Locative](https://www.locative.io/).

## Use cases

- Automatically turn on lights when someone is home
- Automatically turn off lights when no-one is home
- Control lights using Siri or other services via HTTP
- Automatically turn on external lights when the sun sets and turn them off at sunrise
- Store time-series data about temperature, humidity, light level and air pressure

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
$ export PARTICLE_EMAIL="your@email.address"
$ export PARTICLE_PASSWORD="yourParticlePassword"
$ PORT=8080 npm start
```

To enable Siri integration, install Homebridge on a computer that's on your local network
(`npm i -g homebridge`) and start it by running the following command in the root of this project:

```shell
DEBUG=* homebridge -D -P ./homebridge-lights/
```

## Production build

Compile the project as JavaScript into `dist/`:

```shell
$ npm run dist
```

## Environment variables

- **PARTICLE_EMAIL**: Your Particle account's email address (required).
- **PARTICLE_PASSWORD**: Your Particle account's password (required).
- **PORT**: The port that the server should run on. Defaults to 8080.
