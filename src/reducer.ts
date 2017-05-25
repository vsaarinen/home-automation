import { Action } from './actions';
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

const MINIMUM_LIGHT_LEVEL = 60;

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
        timestamp.getHours() < 21 && timestamp.getHours() > 9
      ) {
        actionsToTake = [
          ...actionsToTake,
          { command: AutomationActionCommand.ENABLE_LIGHT, target: '1' },
          { command: AutomationActionCommand.ENABLE_LIGHT, target: '2' },
        ];
        lightSetAutomatically = true;
        lastAutomaticLightState = {
          ...lastAutomaticLightState,
          1: true,
          2: true,
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
      return {
        ...state,
        lastAutomaticLightState: {
          ...lastAutomaticLightState,
          [action.lightId]: action.enabled,
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
            { command: AutomationActionCommand.ENABLE_LIGHT, target: '1' },
            { command: AutomationActionCommand.ENABLE_LIGHT, target: '2' },
          ];
          lightSetAutomatically = true;
          lastAutomaticLightState = {
            ...lastAutomaticLightState,
            1: true,
            2: true,
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
        const peoplePresent = state.peoplePresent.filter(person => person !== action.person);
        if (peoplePresent.length === 0) {
          actionsToTake = [
            ...actionsToTake,
            { command: AutomationActionCommand.DISABLE_LIGHT, target: '1' },
            { command: AutomationActionCommand.DISABLE_LIGHT, target: '2' },
          ];

          // We reset the automatic light switching when the last person leaves the house
          lightSetAutomatically = false;
          lastAutomaticLightState = {
            ...lastAutomaticLightState,
            1: false,
            2: false,
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
