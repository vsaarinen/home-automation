import {
  Action,
  CLEAR_ACTIONS_TO_TAKE,
  REMOVE_PERSON_PRESENT,
  SET_HUMIDITY,
  SET_LIGHT_LEVEL,
  SET_PERSON_PRESENT,
  SET_PRESSURE,
  SET_TEMPERATURE,
} from './actions';
import { AutomationAction, AutomationActionCommand } from './remote';

export interface State {
  peoplePresent: string[];
  lightLevel: number;
  temperature: number;
  pressure: number;
  humidity: number;
  actionsToTake: AutomationAction[];
}

const initialState: State = {
  peoplePresent: [],
  lightLevel: 0,
  temperature: 0,
  pressure: 0,
  humidity: 0,
  actionsToTake: [],
};

const reducer = (state = initialState, action: Action): State => {
  switch (action.type) {
    case SET_LIGHT_LEVEL:
      // TODO: turn on light if level low enough and someone home

      return {
        ...state,
        lightLevel: action.value,
      };
    case SET_TEMPERATURE:
      return {
        ...state,
        temperature: action.value,
      };
    case SET_HUMIDITY:
      return {
        ...state,
        humidity: action.value,
      };
    case SET_PRESSURE:
      return {
        ...state,
        pressure: action.value,
      };
    case SET_PERSON_PRESENT:
      if (!state.peoplePresent.find(person => person === action.person)) {
        // TODO: turn on light if light level low enough

        return {
          ...state,
          peoplePresent: state.peoplePresent.concat([action.person]),
        };
      }

      return state;
    case REMOVE_PERSON_PRESENT:
      if (state.peoplePresent.find(person => person === action.person)) {
        let peoplePresent = state.peoplePresent.filter(person => person !== action.person);
        let actionsToTake = state.actionsToTake;
        if (peoplePresent.length === 0) {
          actionsToTake = actionsToTake.concat([
            { command: AutomationActionCommand.DISABLE_LIGHT, target: '1' },
            { command: AutomationActionCommand.DISABLE_LIGHT, target: '2' },
          ]);
        }
        return {
          ...state,
          actionsToTake,
          peoplePresent,
        };
      }

      return state;
    case CLEAR_ACTIONS_TO_TAKE:
      return {
        ...state,
        actionsToTake: [],
      };
    default:
      return state;
  }
};

export default reducer;
