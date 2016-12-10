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
        return reply(
          storeTemperature(parseFloat(value), location).then(() => 'ok!'),
        );
      case 'light':
        return reply(
          storeLightLevel(parseInt(value, 10), location).then(() => 'ok!'),
        );
      case 'pressure':
        return reply(
          storePressure(parseFloat(value), location).then(() => 'ok!'),
        );
      case 'humidity':
        return reply(
          storeHumidity(parseFloat(value), location).then(() => 'ok!'),
        );
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
