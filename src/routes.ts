import * as Hapi from 'hapi';

import { lightControlHandler } from './remote';
import { storageHandler } from './store';

const Inert = require('inert'); // tslint:disable-line

export const initializeRoutes = (server: Hapi.Server) => {
  // Adds the directory handler
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

      return reply(lightControlHandler(group, command));
    },
  });

  server.route({
    method: 'POST',
    path: '/measurement',
    handler: (request, reply) => {
      const { type, value, location } = request.payload; // TODO: validate

      return reply(storageHandler(type, value, location));
    },
  });
};
