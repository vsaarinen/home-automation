// Inspiration from https://github.com/raimohanska/sensor-server/blob/master/time.coffee

import { periodic } from 'most';
import { Store } from 'redux';

import { lightSet } from './actions';
import { Device } from './devices';
import { error } from './log';
import { AutomationActionCommand, takeActions } from './remote';

interface SunCalcObject {
  sunrise: Date;
  sunriseEnd: Date;
  goldenHourEnd: Date;
  solarNoon: Date;
  goldenHour: Date;
  sunsetStart: Date;
  sunset: Date;
  dusk: Date;
  nauticalDusk: Date;
  night: Date;
  nadir: Date;
  nightEnd: Date;
  nauticalDawn: Date;
  dawn: Date;
}

interface SunCalc {
  getTimes(date: Date, latitude: number, longtitude: number): SunCalcObject;
}
const suncalc: SunCalc = require('suncalc');

const ENABLE_OUTSIDE_LIGHT = true;

if (
  ENABLE_OUTSIDE_LIGHT &&
  (!process.env.LATITUDE || !process.env.LONGTITUDE)
) {
  throw new Error(
    'LATITUDE and LONGTITUDE environment variables need to be defined',
  );
}

const currentLocation = {
  latitude: parseFloat(process.env.LATITUDE!),
  longtitude: parseFloat(process.env.LONGTITUDE!),
};

const now = () => new Date();
const minuteS = periodic(1000 * 60).map(now);
const hourS = minuteS.filter((d) => d.getMinutes() === 0);
const dayS = hourS.filter((d) => d.getHours() === 0);

function calculateSunInfo(date: Date): SunCalcObject {
  return suncalc.getTimes(
    date,
    currentLocation.latitude,
    currentLocation.longtitude,
  );
}

let todaySunInfo = calculateSunInfo(now());

if (ENABLE_OUTSIDE_LIGHT) {
  dayS.forEach((d) => {
    todaySunInfo = calculateSunInfo(d);
  });
}

function enableExternalLightControl(store: Store<any>) {
  const externalLightGroup: Device = 'outside';

  const sunriseS = minuteS.filter(
    (d) =>
      d.getHours() === todaySunInfo.sunrise.getHours() &&
      d.getMinutes() === todaySunInfo.sunrise.getMinutes(),
  );

  const sunsetS = minuteS.filter(
    (d) =>
      d.getHours() === todaySunInfo.sunset.getHours() &&
      d.getMinutes() === todaySunInfo.sunset.getMinutes(),
  );

  // Automatically turn off outer lights
  sunriseS.forEach(() => {
    takeActions([
      {
        command: AutomationActionCommand.DISABLE_DEVICE,
        target: externalLightGroup,
        manual: false,
      },
    ])
      .then(() => {
        store.dispatch(lightSet(externalLightGroup, false));
      })
      .catch(() => {
        error('[external-light] Unable to disable external light');
      });
  });

  // Automatically turn on outer lights
  sunsetS.forEach(() => {
    takeActions([
      {
        command: AutomationActionCommand.ENABLE_DEVICE,
        target: externalLightGroup,
        manual: false,
      },
    ])
      .then(() => {
        store.dispatch(lightSet(externalLightGroup, true));
      })
      .catch(() => {
        error('[external-light] Unable to enable external light');
      });
  });
}

function enableNightLightControl(store: Store<any>) {
  const nightLight: Device = 'night';

  const sleepTimeS = minuteS.filter(
    (d) => d.getMinutes() === 0 && d.getHours() === 20,
  );

  const wakeupTimeS = minuteS.filter(
    (d) =>
      d.getMinutes() === 0 &&
      ([0, 6].indexOf(d.getDay()) > -1
        ? d.getHours() === 8
        : d.getHours() === 7),
  );

  // Automatically turn off lights
  sleepTimeS.forEach(() => {
    takeActions([
      {
        command: AutomationActionCommand.ENABLE_DEVICE,
        target: nightLight,
        manual: false,
      },
    ])
      .then(() => {
        store.dispatch(lightSet(nightLight, false));
      })
      .catch(() => {
        error('[night-light] Unable to disable night light');
      });
  });

  // Automatically turn on lights
  wakeupTimeS.forEach(() => {
    takeActions([
      {
        command: AutomationActionCommand.DISABLE_DEVICE,
        target: nightLight,
        manual: false,
      },
    ])
      .then(() => {
        store.dispatch(lightSet(nightLight, true));
      })
      .catch(() => {
        error('[night-light] Unable to enable night light');
      });
  });
}

export const initializeTimeBasedActions = (store: Store<any>) => {
  if (ENABLE_OUTSIDE_LIGHT) {
    enableExternalLightControl(store);
  }
  enableNightLightControl(store);
};
