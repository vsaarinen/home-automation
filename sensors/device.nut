#require "APDS9007.class.nut:1.0.0"
#require "LPS25H.class.nut:2.0.1"
#require "Si702x.class.nut:1.0.0"

const INTERVAL_SECONDS = 600;

// Light
local lightOutputPin = hardware.pin5;
lightOutputPin.configure(ANALOG_IN);
local lightEnablePin = hardware.pin7;
lightEnablePin.configure(DIGITAL_OUT, 1);
local lightSensor = APDS9007(lightOutputPin, 47000, lightEnablePin);

// Temperature, humidity and pressure
hardware.i2c89.configure(CLOCK_SPEED_400_KHZ);
local pressureSensor = LPS25H(hardware.i2c89);
local tempHumidSensor = Si702x(hardware.i2c89);

function readSensors() {
    server.log("--- Reading sensors ---");
    tempHumidSensor.read(function(result) {
       if ("err" in result) {
           server.error("Error reading temperature: " + result.err);
           return;
       }

       server.log(format("Got temperature: %0.1f deg C", result.temperature));
       server.log(format("Got humidity: %0.1f%%", result.humidity));
       agent.send("temperatureAndHumidity", result);
    });

    pressureSensor.enable(true);
    pressureSensor.read(function(result) {
        if ("err" in result) {
            server.error("An Error Occurred: " + result.err);
            return;
        }
        server.log(format("Got pressure: %0.2f hPa", result.pressure));
        agent.send("pressure", result.pressure);
        pressureSensor.enable(false);
    });

    local light = lightSensor.read();
    server.log(format("Got light level: %0.2f", light));
    agent.send("light", light);

    imp.wakeup(INTERVAL_SECONDS, readSensors);
}

readSensors();
