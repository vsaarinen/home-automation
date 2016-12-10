import * as Hapi from 'hapi';

import { disableLight, enableLight } from './remote';

const server = new Hapi.Server();
server.connection({
  port: process.env.PORT || 8080,
});

server.route({
  method: 'GET',
  path: '/',
  handler: (_request, reply) => {
    reply(`Hi there`);
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
