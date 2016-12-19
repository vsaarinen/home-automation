// Inspiration from https://github.com/raimohanska/sensor-server/blob/master/time.coffee

import { periodic } from 'most';

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

export const dawnS = minuteS.filter(
  d => d.getHours() === todaySunInfo.dawn.getHours() && d.getMinutes() === todaySunInfo.dawn.getMinutes(),
);

export const duskS = minuteS.filter(
  d => d.getHours() === todaySunInfo.dusk.getHours() && d.getMinutes() === todaySunInfo.dusk.getMinutes(),
);
