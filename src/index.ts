import * as Hapi from 'hapi';
import * as Path from 'path';

import { disableLight, enableLight } from './remote';

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
  path: '/groups/{groupId}/{command}',
  handler: (request, reply) => {
    const group = request.params['groupId']; // TODO: validate
    const command = request.params['command'];
    if (command === 'enable') {
      enableLight(group);
      return reply(`turning on group ${group}`);
    } else if (command === 'disable') {
      disableLight(group);
      return reply(`turning off group ${group}`);
    } else {
      console.error(`Unknown command ${command}`);
      return reply(`Unknown command ${command}`);
    }
  },
});

server.start((err) => {
  if (err) { throw err; }
  console.log('Server running at:', server.info.uri);
});
