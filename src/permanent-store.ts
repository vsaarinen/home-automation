import { FieldType, InfluxDB } from 'influx';

import { error, log } from './log';
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
    {
      measurement: 'personLocation',
      fields: {
        isHome: FieldType.BOOLEAN,
      },
      tags: [
        'person',
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
    log('Connected to InfluxDB');
  })
  .catch(err => {
    error(`Error creating Influx database!`, err);
  });

const storeMeasurementData = (valueType: string, value: number, tags: { [tag: string]: string }) =>
  influx.writeMeasurement(valueType, [
    {
      tags,
      fields: { [valueType]: value },
    },
  ])
  .then(() => {
    log(`Stored data to InfluxDB: [${valueType}] ${value} @ ${tags['location']}`);
  })
  .catch(err => {
    error(`Error saving data to InfluxDB! ${err.stack}`);
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
      error(`Unknown sensor type ${type}`);
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
        log(`Stored data to InfluxDB: [lightSwitch] ${enabled}, group ${group}, manual ${manual}`);
      });
      break;
    default:
      throw new Error(`Unable to store unknown action type: ${action.command}`);
  }

  return storagePromise.catch(err => {
    error(`Error saving action data to InfluxDB! ${err.stack}`);
    throw new Error('Error saving action data to InfluxDB!');
  });
};

export const storeLocationChange = (person: string, isHome: boolean) =>
  influx.writeMeasurement('personLocation', [
    {
      tags: { person },
      fields: { isHome },
    },
  ])
  .then(() => {
    log(`Stored data to InfluxDB: [personLocation] ${person}, isHome ${isHome}`);
  })
  .catch(err => {
    error(`Error saving location data to InfluxDB! ${err.stack}`);
    throw new Error('Error saving location data to InfluxDB!');
  });
