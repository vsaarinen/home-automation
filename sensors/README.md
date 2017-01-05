# Home automation sensors

The sensors—light, temperature, humidity and pressure—are run on an
[Electric Imp](https://www.sparkfun.com/products/11395) with the included
[Env tail](https://electricimp.com/docs/tails/env/). I strongly recommend
the Electric Imp as a way to connect a device online—it's been fantastic.

The [device code](device.nut) periodically reads values from the sensors
and sends them to the [agent](agent.nut), which forwards them to the home
automation server.
