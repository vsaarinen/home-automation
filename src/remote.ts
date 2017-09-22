import { Device } from './devices';
import { error, log } from './log';
import { storeAction } from './permanent-store';

const TelldusAPI = require('telldus-live');

interface TelldusDevice {
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
let devices: TelldusDevice[];

const cloud = new TelldusAPI.TelldusAPI({ publicKey, privateKey })
  .login(token, tokenSecret, (err: any, _user: any) => {
    if (!!err) {
      return error('login error: ' + err);
    }

    log('[telldus] Logged in to Telldus successfully');
  })
  .on('error', (err: any) => {
    error('background error: ' + err);
  });

cloud.getDevices((err: any, devicesResponse: any) => {
  if (!!err) {
    return error('getDevices error: ' + err);
  }

  devices = devicesResponse;
  log('[telldus] Found devices:', devices.map(d => d.name));
});

export enum AutomationActionCommand {
  DISABLE_DEVICE,
  ENABLE_DEVICE,
}

export interface AutomationAction {
  command: AutomationActionCommand;
  target: Device;
  manual?: boolean;
}

// Takes the desired actions and stores them to the permanent storage
export function takeActions(actions: AutomationAction[]) {
  if (!devices) {
    error('[telldus] No device information available');
    return Promise.reject('Unabled to connect to Telldus');
  }

  return Promise.all(
    actions.map(action => new Promise(
      (resolve, reject) => handleAction(action, resolve, reject),
    )));
}

function findDevice(name: string) {
  return devices && devices.find(d => d.name.toLowerCase().indexOf(name) > -1);
}

function handleAction(
  action: AutomationAction,
  resolve: (value?: any | PromiseLike<any>) => void,
  reject: (reason?: any) => void,
) {
  let targetDevice: TelldusDevice | undefined;
  log(`[action] Handling action ${action.command} on ${action.target}`);
  if (!devices) {
    error('[telldus] No devices found');
    return reject('No device targets');
  }

  switch (action.target) {
    case 'sofa':
    case 'speakers':
    case 'tv':
    case 'window':
    case 'outside':
    case 'kitchen':
    case 'table':
    case 'bedroom':
    case 'dining':
    case 'living':
    case 'bedroom':
      targetDevice = findDevice(action.target);
      break;
    case 'lights':
      targetDevice = devices.find(d => d.name.toLowerCase() === 'lights');
      break;
  }

  if (!targetDevice) {
    error('[action] Unknonwn target', action.target);
    return reject('Unknown target');
  }

  cloud.onOffDevice(
    targetDevice,
    action.command === AutomationActionCommand.ENABLE_DEVICE,
    (err: any, _result: any) => {
      if (!!err) {
        error('[telldus] onOffDevice error: ' + err.message);
        reject('Unable to send on/off command');
      }

      return storeAction(action).then(() => resolve());
    },
  );
}
