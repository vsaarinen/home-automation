import * as Hapi from 'hapi';

import { permanentStorageHandler } from './permanent-store';
import { AutomationAction, AutomationActionCommand, takeActions } from './remote';

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
      const { group, command } = request.params;
      let action: AutomationAction;

      switch (command) {
        case 'enable':
          action = { command: AutomationActionCommand.ENABLE_LIGHT, target: group };
          break;
        case 'disable':
          action = { command: AutomationActionCommand.DISABLE_LIGHT, target: group };
          break;
        default:
          return reply(new Error(`Unknown command ${command}!`));
      }

      return reply(
        takeActions([action])
          .then(() => `Command ${command} sent to group ${group}`)
          .catch((e: any) => Promise.reject(new Error(`Unable to ${command} group ${group}: ${JSON.stringify(e)}`))),
      );
    },
  });

  server.route({
    method: 'POST',
    path: '/measurement',
    handler: (request, reply) => {
      const { type, value, location } = request.payload; // TODO: validate

      return reply(
        permanentStorageHandler(type, value, location)
          .then(() => 'ok!')
          .catch((_e: any) => Promise.reject(new Error(`Unable to store ${type} measurement group ${value}`))),
      );
    },
  });
};
