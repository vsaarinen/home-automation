import * as Hapi from 'hapi';
import { Store } from 'redux';

import {
  removePersonPresent,
  setHumidity,
  setLightLevel,
  setPersonPresent,
  setPressure,
  setTemperature,
} from './actions';
import { permanentStorageHandler, storeLocationChange } from './permanent-store';
import { State } from './reducer';
import { AutomationAction, AutomationActionCommand, takeActions } from './remote';

const Inert = require('inert'); // tslint:disable-line

export const initializeRoutes = (server: Hapi.Server, store: Store<State>) => {
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
          action = { command: AutomationActionCommand.ENABLE_LIGHT, target: group, manual: true };
          break;
        case 'disable':
          action = { command: AutomationActionCommand.DISABLE_LIGHT, target: group, manual: true };
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
    method: 'GET',
    path: '/state',
    handler: (_request, reply) => reply(JSON.stringify(store.getState())),
  });

  server.route({
    method: 'GET',
    path: '/lightLevel',
    handler: (_request, reply) => reply(JSON.stringify(store.getState().lightLevel)),
  });

  server.route({
    method: 'POST',
    path: '/measurement',
    handler: (request, reply) => {
      const { type, value, location } = request.payload; // TODO: validate

      // TODO: also store location in Redux state
      switch (type) {
        case 'temperature':
          store.dispatch(setTemperature(value));
          break;
        case 'pressure':
          store.dispatch(setPressure(value));
          break;
        case 'humidity':
          store.dispatch(setHumidity(value));
          break;
        case 'light':
          store.dispatch(setLightLevel(value));
          break;
        default:
          return reply(new Error(`Unknown measurement type ${type}!`));
      }

      return reply(
        permanentStorageHandler(type, value, location)
          .then(() => 'ok!')
          .catch((_e: any) => { throw new Error(`Unable to store ${type} measurement group ${value} into database`); }),
      );
    },
  });

  server.route({
    method: 'GET',
    path: '/location/{person}/{action}',
    handler: (request, reply) => {
      const { action, person } = request.params; // TODO: validate

      if (action === 'arriving') {
        store.dispatch(setPersonPresent(person));
      } else if (action === 'leaving') {
        store.dispatch(removePersonPresent(person));
      } else {
        return reply(new Error(`Unknown action ${action}!`));
      }

      return reply(
        storeLocationChange(person, action === 'arriving')
          .then(() => 'ok!')
          .catch((_e: any) => {
            throw new Error(`Unable to store ${action} for ${person} into database`);
          }),
      );
    },
  });
};
