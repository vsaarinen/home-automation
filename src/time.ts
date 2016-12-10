// Inspiration from https://github.com/raimohanska/sensor-server/blob/master/time.coffee

import { periodic } from 'most';

export const minuteS = periodic(1000 * 60).map(() => new Date());
export const hourS = minuteS.filter(d => d.getMinutes() === 0);
export const dayS = hourS.filter(d => d.getHours() === 0);
