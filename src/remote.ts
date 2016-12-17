import { storeAction } from './permanent-store';

const Particle = require('particle-api-js'); // tslint:disable-line

const particle = new Particle();
let accessToken: string;
let deviceId: string;

interface ParticleResponse<T> {
  body: T;
  statusCode: number;
}

interface Login {
  token_type: 'bearer';
  access_token: string;
  expires_in: number;
  refresh_token: string;
};

interface Device {
  id: string;
  name: string;
  last_app?: string;
  last_ip_address?: string;
  last_heard?: string;
  product_id: number;
  connected: boolean;
  platform_id: number;
  cellular: boolean;
  status: string;
}

interface FunctionCall {
  id: string;
  last_app: string;
  connected: boolean;
  return_value: number;
}

export enum AutomationActionCommand {
  ENABLE_LIGHT,
  DISABLE_LIGHT,
};
export interface AutomationAction {
  command: AutomationActionCommand;
  target: string;
}

const loginPromise = particle.login({
  username: process.env.PARTICLE_EMAIL,
  password: process.env.PARTICLE_PASSWORD,
}).then((data: ParticleResponse<Login>) => {
  console.log('Logged in to Particle successfully'); // tslint:disable-line
  accessToken = data.body.access_token;
  return particle.listDevices({ auth: accessToken });
}).then((devices: ParticleResponse<Device[]>) => {
  deviceId = devices.body[0].id;
}).catch((err: any) => {
  console.error('Particle initialization failed:', err);
});

const callParticleFunction = (command: string, group: string): Promise<void> =>
  loginPromise.then(() => {
    if (!accessToken || !deviceId) {
      throw new Error('Particle connection not initialized!');
    }

    console.log(`Sending ${command} to group ${group}.`); // tslint:disable-line
    particle.callFunction({
      deviceId,
      name: command,
      argument: group,
      auth: accessToken,
    }).then((data: ParticleResponse<FunctionCall>) => {
      console.log(`Connected: ${data.body.connected}, result: ${data.body.return_value}`); // tslint:disable-line
    }).catch((err: any) => {
      console.error(`Unable to ${command} group ${group}:`, err);
    });
  });

const enableLight = (group: string) => callParticleFunction('turnOn', group);
const disableLight = (group: string) => callParticleFunction('turnOff', group);

// Takes the desired actions and stores the actions to the permanent storage
export const takeActions = (actions: AutomationAction[]) => {
  return Promise.all(actions.map(action => handleAction(action)));
};
const handleAction = (action: AutomationAction) => {
  switch (action.command) {
    case AutomationActionCommand.ENABLE_LIGHT:
      return enableLight(action.target)
        .then(() => storeAction(action));
    case AutomationActionCommand.DISABLE_LIGHT:
      return disableLight(action.target)
        .then(() => storeAction(action));
    default:
      throw new Error(`Unknown command ${action.command}`);
  }
};
