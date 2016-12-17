export type SET_LIGHT_LEVEL = 'SET_LIGHT_LEVEL';
export const SET_LIGHT_LEVEL: SET_LIGHT_LEVEL = 'SET_LIGHT_LEVEL';
interface SetLightLevelAction {
  type: SET_LIGHT_LEVEL;
  value: number;
}
export const setLightLevel = (value: number): SetLightLevelAction => ({
  type: SET_LIGHT_LEVEL,
  value,
});

export type CLEAR_ACTIONS_TO_TAKE = 'CLEAR_ACTIONS_TO_TAKE';
export const CLEAR_ACTIONS_TO_TAKE: CLEAR_ACTIONS_TO_TAKE = 'CLEAR_ACTIONS_TO_TAKE';
interface ClearActionsToTakeAction {
  type: CLEAR_ACTIONS_TO_TAKE;
}
export const clearActionsToTake = (): ClearActionsToTakeAction => ({
  type: CLEAR_ACTIONS_TO_TAKE,
});

export type SET_PERSON_PRESENT = 'SET_PERSON_PRESENT';
export const SET_PERSON_PRESENT: SET_PERSON_PRESENT = 'SET_PERSON_PRESENT';
interface SetPersonPresentAction {
  type: SET_PERSON_PRESENT;
  person: string;
}
export const setPersonPresent = (person: string): SetPersonPresentAction => ({
  type: SET_PERSON_PRESENT,
  person,
});

export type REMOVE_PERSON_PRESENT = 'REMOVE_PERSON_PRESENT';
export const REMOVE_PERSON_PRESENT: REMOVE_PERSON_PRESENT = 'REMOVE_PERSON_PRESENT';
interface RemovePersonPresentAction {
  type: REMOVE_PERSON_PRESENT;
  person: string;
}
export const removePersonPresent = (person: string): RemovePersonPresentAction => ({
  type: REMOVE_PERSON_PRESENT,
  person,
});

export type SET_TEMPERATURE = 'SET_TEMPERATURE';
export const SET_TEMPERATURE: SET_TEMPERATURE = 'SET_TEMPERATURE';
interface SetTemperatureAction {
  type: SET_TEMPERATURE;
  value: number;
}
export const setTemperature = (value: number): SetTemperatureAction => ({
  type: SET_TEMPERATURE,
  value,
});

export type SET_HUMIDITY = 'SET_HUMIDITY';
export const SET_HUMIDITY: SET_HUMIDITY = 'SET_HUMIDITY';
interface SetHummidityAction {
  type: SET_HUMIDITY;
  value: number;
}
export const setHumidity = (value: number): SetHummidityAction => ({
  type: SET_HUMIDITY,
  value,
});

export type SET_PRESSURE = 'SET_PRESSURE';
export const SET_PRESSURE: SET_PRESSURE = 'SET_PRESSURE';
interface SetPressureAction {
  type: SET_PRESSURE;
  value: number;
}
export const setPressure = (value: number): SetPressureAction => ({
  type: SET_PRESSURE,
  value,
});

export type Action =
  SetLightLevelAction |
  SetHummidityAction |
  SetTemperatureAction |
  SetPressureAction |
  ClearActionsToTakeAction | 
  SetPersonPresentAction |
  RemovePersonPresentAction;
