import { FieldType, InfluxDB } from 'influx';

import { AutomationAction, AutomationActionCommand } from './remote';

const DB_NAME = 'koti';

const influx = new InfluxDB({
  host: 'localhost',
  database: DB_NAME,
  schema: [
    {
      measurement: 'temperature',
      fields: {
        temperature: FieldType.FLOAT,
      },
      tags: [
        'location',
      ],
    },
    {
      measurement: 'pressure',
      fields: {
        pressure: FieldType.FLOAT,
      },
      tags: [
        'location',
      ],
    },
    {
      measurement: 'humidity',
      fields: {
        humidity: FieldType.FLOAT,
      },
      tags: [
        'location',
      ],
    },
    {
      measurement: 'light',
      fields: {
        light: FieldType.FLOAT,
      },
      tags: [
        'location',
      ],
    },
    {
      measurement: 'lightSwitch',
      fields: {
        enabled: FieldType.BOOLEAN,
      },
      tags: [
        'group',
        'manual',
      ],
    },
  ],
});

influx.getDatabaseNames()
  .then(names => {
    if (names.indexOf(DB_NAME) === -1) {
      return influx.createDatabase(DB_NAME);
    }

    return;
  })
  .then(() => {
    console.log('Connected to InfluxDB'); // tslint:disable-line:no-console
  })
  .catch(err => {
    console.error(`Error creating Influx database!`, err);
  });

const storeMeasurementData = (valueType: string, value: number, tags: { [tag: string]: string }) =>
  influx.writeMeasurement(valueType, [
    {
      tags,
      fields: { [valueType]: value },
    },
  ])
  .then(() => {
    console.log(`Stored data to InfluxDB: [${valueType}] ${value} @ ${tags['location']}`); // tslint:disable-line
  })
  .catch(err => {
    console.error(`Error saving data to InfluxDB! ${err.stack}`);
    throw new Error('Error saving data to InfluxDB!');
  });

export const permanentStorageHandler = (type: string, value: string, location: string) => {
  switch (type) {
    case 'temperature':
    case 'pressure':
    case 'humidity':
    case 'light':
      return storeMeasurementData(type, parseFloat(value), { location });
    default:
      console.error(`Unknown sensor type ${type}`);
      throw new Error(`Unknown sensor type ${type}`);
  }
};

export const storeAction = (action: AutomationAction) => {
  let storagePromise: Promise<void>;
  let manual = false;

  switch (action.command) {
    case AutomationActionCommand.ENABLE_LIGHT:
    case AutomationActionCommand.DISABLE_LIGHT:
      const group = action.target;
      const enabled = action.command === AutomationActionCommand.ENABLE_LIGHT;

      storagePromise = influx.writeMeasurement('lightSwitch', [
        {
          tags: { group, manual: manual.toString() },
          fields: { lightSwitch: enabled },
        },
      ])
      .then(() => {
        console.log(`Stored data to InfluxDB: [lightSwitch] ${enabled}, group ${group}, manual ${manual}`); // tslint:disable-line
      });
      break;
    default:
      throw new Error(`Unable to store unknown action type: ${action.command}`);
  }

  return storagePromise.catch(err => {
    console.error(`Error saving data to InfluxDB! ${err.stack}`);
    throw new Error('Error saving data to InfluxDB!');
  });
};
