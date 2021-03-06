import * as Hapi from 'hapi';
import { Store } from 'redux';

import {
  lightSet,
  removePersonPresent,
  setHumidity,
  setLightLevel,
  setPersonPresent,
  setPressure,
  setTemperature,
} from './actions';
import { Device } from './devices';
import {
  permanentStorageHandler,
  storeLocationChange,
} from './permanent-store';
import { State } from './reducer';
import {
  AutomationAction,
  AutomationActionCommand,
  takeActions,
} from './remote';

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
    path: '/control/{target}/{command}/{manual?}',
    handler: (request, reply) => {
      const { command, manual } = request.params;
      const target = request.params.target as Device;
      // TODO: validate target?
      let action: AutomationAction;

      switch (command) {
        case 'enable':
          action = {
            command: AutomationActionCommand.ENABLE_DEVICE,
            target,
            manual: !!manual,
          };
          store.dispatch(lightSet(target, true));
          break;
        case 'disable':
          action = {
            command: AutomationActionCommand.DISABLE_DEVICE,
            target,
            manual: !!manual,
          };
          store.dispatch(lightSet(target, false));
          break;
        default:
          return reply(new Error(`Unknown command ${command}!`));
      }

      return reply(
        takeActions([action])
          .then(() => `Command ${command} sent to target ${target}`)
          .catch((e: any) =>
            Promise.reject(
              new Error(
                `Unable to ${command} target ${target}: ${JSON.stringify(e)}`,
              ),
            ),
          ),
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
    path: '/light/{group}',
    handler: (request, reply) => {
      const lightEnabled = store.getState().lastAutomaticLightState[
        request.params.group
      ]; // tslint:disable-line
      return reply(JSON.stringify(lightEnabled ? 1 : 0));
    },
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
          store.dispatch(setLightLevel(value, new Date()));
          break;
        default:
          return reply(new Error(`Unknown measurement type ${type}!`));
      }

      return reply(
        permanentStorageHandler(type, value, location)
          .then(() => 'ok!')
          .catch((_e: any) => {
            throw new Error(
              `Unable to store ${type} measurement group ${value} into database`,
            );
          }),
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
            throw new Error(
              `Unable to store ${action} for ${person} into database`,
            );
          }),
      );
    },
  });
};
