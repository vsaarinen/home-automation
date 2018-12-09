// Inspiration from https://github.com/raimohanska/sensor-server/blob/master/time.coffee

import { periodic } from 'most';
import { Store } from 'redux';

import { lightSet } from './actions';
import { Device } from './devices';
import { error } from './log';
import {
  AutomationAction,
  AutomationActionCommand,
  takeActions,
} from './remote';

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

if (!process.env.LATITUDE || !process.env.LONGTITUDE) {
  throw new Error(
    'LATITUDE and LONGTITUDE environment variables need to be defined',
  );
}

const currentLocation = {
  latitude: parseFloat(process.env.LATITUDE!),
  longtitude: parseFloat(process.env.LONGTITUDE!),
};

const now = () => new Date();

const calculateSunInfo = (date: Date): SunCalcObject =>
  suncalc.getTimes(date, currentLocation.latitude, currentLocation.longtitude);

let todaySunInfo = calculateSunInfo(now());

const minuteS = periodic(1000 * 60).map(now);
const hourS = minuteS.filter(d => d.getMinutes() === 0);
const dayS = hourS.filter(d => d.getHours() === 0);

dayS.forEach(d => {
  todaySunInfo = calculateSunInfo(d);
});

const sunriseS = minuteS.filter(
  d =>
    d.getHours() === todaySunInfo.sunrise.getHours() &&
    d.getMinutes() === todaySunInfo.sunrise.getMinutes(),
);

const sunsetS = minuteS.filter(
  d =>
    d.getHours() === todaySunInfo.sunset.getHours() &&
    d.getMinutes() === todaySunInfo.sunset.getMinutes(),
);

export const initializeTimeBasedActions = (store: Store<any>) => {
  const externalLightGroup: Device = 'outside';

  // Automatically turn off outer lights
  sunriseS.forEach(() => {
    const action: AutomationAction = {
      command: AutomationActionCommand.DISABLE_DEVICE,
      target: externalLightGroup,
      manual: false,
    };
    takeActions([action])
      .then(() => {
        store.dispatch(lightSet(externalLightGroup, false));
      })
      .catch(() => {
        error('[external-light] Unable to disable external light');
      });
  });

  // Automatically turn on outer lights
  sunsetS.forEach(() => {
    const action: AutomationAction = {
      command: AutomationActionCommand.ENABLE_DEVICE,
      target: externalLightGroup,
      manual: false,
    };
    takeActions([action])
      .then(() => {
        store.dispatch(lightSet(externalLightGroup, true));
      })
      .catch(() => {
        error('[external-light] Unable to enable external light');
      });
  });
};
