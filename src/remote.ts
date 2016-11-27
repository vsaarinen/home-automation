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

const loginPromise = particle.login({
  username: process.env['PARTICLE_EMAIL'],
  password: process.env['PARTICLE_PASSWORD'],
}).then((data: ParticleResponse<Login>) => {
  console.log('Logged in to Particle successfully');
  accessToken = data.body.access_token;
  return particle.listDevices({ auth: accessToken });
}).then((devices: ParticleResponse<Device[]>) => {
  deviceId = devices.body[0].id;
}).catch((err: any) => {
  console.log('Particle initialization failed:', err);
});

const callParticleFunction = (command: string, group: string) => {
  Promise.all([loginPromise]).then(() => {
    if (!accessToken || !deviceId) {
      throw new Error('Particle connection not initialized!');
    }

    particle.callFunction({
      deviceId,
      name: command,
      argument: group,
      auth: accessToken,
    }).then((data: ParticleResponse<FunctionCall>) => {
      console.log(`Tried to ${command} group ${group}. ` +
        `Connected: ${data.body.connected}, result: ${data.body.return_value}`);
    }).catch((err: any) => {
      console.log(`Unable to ${command} group ${group}:`, err);
    });
  });
};

export const enableLight = (group: string) => {
  callParticleFunction('turnOn', group);
};

export const disableLight = (group: string) => {
  callParticleFunction('turnOff', group);
};
