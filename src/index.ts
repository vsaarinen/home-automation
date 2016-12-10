import * as Hapi from 'hapi';
import * as Path from 'path';

import { disableLight, enableLight } from './remote';
import { storeHumidity, storeLightLevel, storePressure, storeTemperature } from './store';

const Inert = require('inert'); // tslint:disable-line

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

server.register(Inert, () => {}); // tslint:disable-line

server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: '.',
      redirectToSlash: true,
      index: true,
    },
  },
});

server.route({
  method: 'GET',
  path: '/groups/{group}/{command}',
  handler: (request, reply) => {
    const { group, command } = request.params; // TODO: validate

    if (command === 'enable') {
      enableLight(group);
      return reply(`turning on group ${group}`);
    } else if (command === 'disable') {
      disableLight(group);
      return reply(`turning off group ${group}`);
    } else {
      console.error(`Unknown command ${command}`);
      return reply(new Error(`Unknown command ${command}`));
    }
  },
});

server.route({
  method: 'POST',
  path: '/measurement',
  handler: (request, reply) => {
    const { type, value, location } = request.payload; // TODO: validate

    switch (type) {
      case 'temperature':
        storeTemperature(parseFloat(value), location);
        return reply('Ok!');
      case 'light':
        storeLightLevel(parseInt(value, 10), location);
        return reply('Ok!');
      case 'pressure':
        storePressure(parseFloat(value), location);
        return reply('Ok!');
      case 'humidity':
        storeHumidity(parseFloat(value), location);
        return reply('Ok!');
      default:
        console.error(`Unknown sensor type ${type}`);
        return reply(new Error(`Unknown sensor type ${type}`));
    }
  },
});

server.start((err) => {
  if (err) { throw err; }
  console.log('Server running at:', server.info.uri); // tslint:disable-line:no-console
});
