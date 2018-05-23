import fromPairs = require('lodash/fromPairs');

import { Action } from './actions';
import { automaticLights } from './devices';
import { AutomationAction, AutomationActionCommand } from './remote';

export interface State {
  peoplePresent: string[];
  lightLevel: number;
  temperature: number;
  pressure: number;
  humidity: number;
  actionsToTake: AutomationAction[];
  lightSetAutomatically: boolean;
  lastAutomaticLightState: {
    [id: string]: boolean;
  };
}

const initialState: State = {
  peoplePresent: [],
  lightLevel: 0,
  temperature: 0,
  pressure: 0,
  humidity: 0,
  actionsToTake: [],
  lightSetAutomatically: false,
  lastAutomaticLightState: {},
};

const MINIMUM_LIGHT_LEVEL = 120;

// TODO: Handle the case when the light has been enabled manually

const reducer = (state = initialState, action: Action): State => {
  let { actionsToTake, lightSetAutomatically, lastAutomaticLightState } = state;

  switch (action.type) {
    case 'SET_LIGHT_LEVEL':
      const { timestamp, value } = action;

      if (
        !lightSetAutomatically &&
        state.peoplePresent.length > 0 &&
        value < MINIMUM_LIGHT_LEVEL &&
        // Only set the light automatically if I'm home and it's not after 21
        timestamp.getHours() < 21 &&
        timestamp.getHours() > 9
      ) {
        actionsToTake = [
          ...actionsToTake,
          ...automaticLights.map(target => ({
            command: AutomationActionCommand.ENABLE_DEVICE,
            target,
          })),
        ];
        lightSetAutomatically = true;
        lastAutomaticLightState = {
          ...lastAutomaticLightState,
          ...fromPairs(automaticLights.map(target => [target, true])),
        };
      }

      return {
        ...state,
        actionsToTake,
        lightSetAutomatically,
        lastAutomaticLightState,
        lightLevel: value,
      };
    case 'LIGHT_SET':
      let individualLights;
      switch (action.lightId) {
        case 'dining':
          individualLights = ['table', 'kitchen'];
          break;
        case 'living':
          individualLights = ['sofa', 'tv', 'window'];
          break;
        case 'lights':
          individualLights = ['table', 'kitchen', 'sofa', 'tv', 'window'];
          break;
        default:
          individualLights = [action.lightId];
      }
      return {
        ...state,
        lastAutomaticLightState: {
          ...lastAutomaticLightState,
          ...fromPairs(individualLights.map(light => [light, action.enabled])),
        },
      };
    case 'SET_TEMPERATURE':
      return {
        ...state,
        temperature: action.value,
      };
    case 'SET_HUMIDITY':
      return {
        ...state,
        humidity: action.value,
      };
    case 'SET_PRESSURE':
      return {
        ...state,
        pressure: action.value,
      };
    case 'SET_PERSON_PRESENT':
      if (!state.peoplePresent.find(person => person === action.person)) {
        if (
          !lightSetAutomatically &&
          state.peoplePresent.length === 0 &&
          state.lightLevel < MINIMUM_LIGHT_LEVEL
        ) {
          actionsToTake = [
            ...actionsToTake,
            ...automaticLights.map(target => ({
              command: AutomationActionCommand.ENABLE_DEVICE,
              target,
            })),
          ];
          lightSetAutomatically = true;
          lastAutomaticLightState = {
            ...lastAutomaticLightState,
            ...fromPairs(automaticLights.map(target => [target, true])),
          };
        }

        return {
          ...state,
          actionsToTake,
          lightSetAutomatically,
          lastAutomaticLightState,
          peoplePresent: [...state.peoplePresent, action.person],
        };
      }

      return state;
    case 'REMOVE_PERSON_PRESENT':
      if (state.peoplePresent.find(person => person === action.person)) {
        const peoplePresent = state.peoplePresent.filter(
          person => person !== action.person,
        );
        if (peoplePresent.length === 0) {
          actionsToTake = [
            ...actionsToTake,
            ...automaticLights.map(target => ({
              command: AutomationActionCommand.DISABLE_DEVICE,
              target,
            })),
          ];

          // We reset the automatic light switching when the last person leaves the house
          lightSetAutomatically = false;
          lastAutomaticLightState = {
            ...lastAutomaticLightState,
            ...fromPairs(automaticLights.map(target => [target, false])),
          };
        }
        return {
          ...state,
          actionsToTake,
          lastAutomaticLightState,
          lightSetAutomatically,
          peoplePresent,
        };
      }

      return state;
    case 'CLEAR_ACTIONS_TO_TAKE':
      return {
        ...state,
        actionsToTake: [],
      };
    default:
      return state;
  }
};

export default reducer;
