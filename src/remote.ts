import { error, log } from './log';
import { storeAction } from './permanent-store';

const TelldusAPI = require('telldus-live');

interface Device {
  id: string;
  clientDeviceId: string;
  name: string;
  state: number;
  statevalue: null | string;
  methods: number;
  type: 'group' | 'device';
  client: string;
  clientName: string;
  online: string;
  editable: number;
  ignored: number;
  devices?: string;
  status: 'off' | 'on';
}

const publicKey = process.env.TELLDUS_PUBLIC_KEY;
const privateKey = process.env.TELLDUS_PRIVATE_KEY;
const token = process.env.TELLDUS_TOKEN;
const tokenSecret = process.env.TELLDUS_TOKEN_SECRET;
let devices: Device[];
let speaker: Device | undefined;
let livingRoom: Device | undefined;
let diningRoom: Device | undefined;
let allLights: Device | undefined;

const cloud = new TelldusAPI.TelldusAPI({ publicKey, privateKey })
  .login(token, tokenSecret, (err: any, _user: any) => {
    if (!!err) {
      return error('login error: ' + err.message);
    }

    log('[telldus] Logged in to Telldus successfully');
  })
  .on('error', (err: any) => {
    error('background error: ' + err.message);
  });

cloud.getDevices((err: any, devicesResponse: any) => {
  if (!!err) {
    return error('getDevices error: ' + err.message);
  }

  devices = devicesResponse;
  speaker = devices.find(d => d.name === 'Speakers');
  livingRoom = devices.find(d => d.name === 'Living room');
  diningRoom = devices.find(d => d.name === 'Dining room');
  allLights = devices.find(d => d.name === 'Lights');
});

export enum AutomationActionCommand {
  DISABLE_LIGHT,
  ENABLE_LIGHT,
}

export interface AutomationAction {
  command: AutomationActionCommand;
  target: string;
  manual?: boolean;
}

// Takes the desired actions and stores them to the permanent storage
export const takeActions = (actions: AutomationAction[]) => {
  if (!devices) {
    error('[telldus] No device information available');
    return Promise.reject('Unabled to connect to Telldus');
  }

  return Promise.all(
    actions.map(action => new Promise(
      (resolve, reject) => handleAction(action, resolve, reject),
    )));
};

function handleAction(
  action: AutomationAction,
  resolve: (value?: any | PromiseLike<any>) => void,
  reject: (reason?: any) => void,
) {
  let targetDevice: Device | undefined;
  log(`[action] Handling action ${action.command} on ${action.target}`);

  switch (action.target) {
    case '2':
      targetDevice = livingRoom;
      break;
    case '3':
      targetDevice = speaker;
      break;
    case '1':
      targetDevice = diningRoom;
      break;
  }

  if (!targetDevice) {
    error('[action] Unknonwn target', action.target);
    return reject('Unknown target');
  }

  cloud.onOffDevice(
    targetDevice,
    action.command === AutomationActionCommand.ENABLE_LIGHT,
    (err: any, _result: any) => {
      if (!!err) {
        error('[telldus] onOffDevice error: ' + err.message);
        reject('Unable to send on/off command');
      }

      return storeAction(action).then(() => resolve());
    },
  );
}
