import { error, log } from './log';
import { storeAction } from './permanent-store';

const Particle = require('particle-api-js');

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
  DISABLE_LIGHT,
  ENABLE_LIGHT,
};
export interface AutomationAction {
  command: AutomationActionCommand;
  target: string;
  manual?: boolean;
}

const loginPromise = particle.login({
  username: process.env.PARTICLE_EMAIL,
  password: process.env.PARTICLE_PASSWORD,
}).then((data: ParticleResponse<Login>) => {
  log('[particle] Logged in to Particle successfully');
  accessToken = data.body.access_token;
  return particle.listDevices({ auth: accessToken });
}).then((devices: ParticleResponse<Device[]>) => {
  deviceId = devices.body[0].id;
}).catch((err: any) => {
  error('[particle] Particle initialization failed:', err);
});

const callParticleFunction = (command: string, group: string): Promise<void> =>
  loginPromise.then(() => {
    if (!accessToken || !deviceId) {
      throw new Error('Particle connection not initialized!');
    }

    log(`[particle] Sending ${command} to group ${group}.`);
    particle.callFunction({
      deviceId,
      name: command,
      argument: group,
      auth: accessToken,
    }).then((data: ParticleResponse<FunctionCall>) => {
      log(`[particle] Result for ${command} @ ${group}: ${data.body.return_value}`);
    }).catch((err: any) => {
      error(`[particle] Unable to ${command} group ${group}:`, err);
    });
  });

// We need to wait for at least 2 seconds when enabling/disabling lights
// because that's how long the button press is simulated for on the remote.
const enableLight = (group: string) =>
  new Promise((resolve, _reject) => {
    callParticleFunction('turnOn', group)
      .then(() => { setTimeout(() => resolve(), 2500); });
  });

const disableLight = (group: string) =>
  new Promise((resolve, _reject) => {
    callParticleFunction('turnOff', group)
      .then(() => { setTimeout(() => resolve(), 2500); });
  });

// Takes the desired actions sequentially and stores them to the permanent storage
export const takeActions = (actions: AutomationAction[]) => {
  let p: Promise<{} | void> = Promise.resolve();
  actions.forEach(action => {
    p = p.then(() => handleAction(action));
  });
  return p;
};

const handleAction = (action: AutomationAction) => {
  log(`[action] Handling action ${action.command} on ${action.target}`);
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
