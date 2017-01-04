// Inspiration from https://github.com/raimohanska/sensor-server/blob/master/time.coffee

import { periodic } from 'most';
import { Store } from 'redux';

import { lightSet } from './actions';
import { error } from './log';
import { AutomationAction, AutomationActionCommand, takeActions } from './remote';

type SunCalcObject = {
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
};

interface SunCalc {
  getTimes(date: Date, latitude: number, longtitude: number): SunCalcObject;
}
const suncalc: SunCalc = require('suncalc');

const currentLocation = {
  latitude: 60.173231,
  longtitude: 24.959087,
};

const now = () => new Date();

const calculateSunInfo = (date: Date): SunCalcObject =>
  suncalc.getTimes(date, currentLocation.latitude, currentLocation.longtitude);

let todaySunInfo = calculateSunInfo(now());

const minuteS = periodic(1000 * 60).map(now);
const hourS = minuteS.filter(d => d.getMinutes() === 0);
const dayS = hourS.filter(d => d.getHours() === 0);

dayS.forEach((d) => { todaySunInfo = calculateSunInfo(d); });

const sunriseS = minuteS.filter(
  d => d.getHours() === todaySunInfo.sunrise.getHours() && d.getMinutes() === todaySunInfo.sunrise.getMinutes(),
);

const sunsetS = minuteS.filter(
  d => d.getHours() === todaySunInfo.sunset.getHours() && d.getMinutes() === todaySunInfo.sunset.getMinutes(),
);

export const initializeTimeBasedActions = (store: Store<any>) => {
  // Automatically turn off outer lights
  sunriseS.forEach(() => {
    const externalLightGroup = '3';
    const action: AutomationAction = {
      command: AutomationActionCommand.DISABLE_LIGHT,
      target: externalLightGroup,
      manual: false,
    };
    takeActions([action])
      .then(() => { store.dispatch(lightSet('3', false)); })
      .catch(() => { error('[external-light] Unable to disable external light'); });
  });

  // Automatically turn on outer lights
  sunsetS.forEach(() => {
    const externalLightGroup = '3';
    const action: AutomationAction = {
      command: AutomationActionCommand.ENABLE_LIGHT,
      target: externalLightGroup,
      manual: false,
    };
    takeActions([action])
      .then(() => { store.dispatch(lightSet('3', true)); })
      .catch(() => { error('[external-light] Unable to enable external light'); });
  });
};
