import * as Hapi from 'hapi';
import * as Path from 'path';

import { disableLight, enableLight } from './remote';
import { initializeRoutes } from './routes';
import { storeLightSwitch } from './store';
import { hourS } from './time';

const server = new Hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, '..', 'public'),
      },
    },
  },
});

server.connection({
  host: 'localhost',
  port: process.env.PORT || 8080,
});

initializeRoutes(server);

server.start((err) => {
  if (err) { throw err; }
  console.log('Server running at:', server.info.uri); // tslint:disable-line:no-console
});

// Automatically turn off outer lights
hourS
  .filter(d => d.getHours() === 9)
  .forEach(() => {
    const externalLightGroup = '3';
    disableLight(externalLightGroup)
      .then(() => storeLightSwitch(externalLightGroup, false))
      .catch(() => { console.error('Unable to disable external light'); });
  });

// Automatically turn on outer lights
hourS
  .filter(d => d.getHours() === 17)
  .forEach(() => {
    const externalLightGroup = '3';
    enableLight(externalLightGroup)
      .then(() => storeLightSwitch(externalLightGroup, true))
      .catch(() => { console.error('Unable to enable external light'); });
  });
