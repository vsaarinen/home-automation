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
      tags: ['location'],
    },
    {
      measurement: 'pressure',
      fields: {
        pressure: FieldType.FLOAT,
      },
      tags: ['location'],
    },
    {
      measurement: 'humidity',
      fields: {
        humidity: FieldType.FLOAT,
      },
      tags: ['location'],
    },
    {
      measurement: 'light',
      fields: {
        light: FieldType.FLOAT,
      },
      tags: ['location'],
    },
    {
      measurement: 'switchedLight',
      fields: {
        enabled: FieldType.BOOLEAN,
      },
      tags: ['group', 'manual'],
    },
    {
      measurement: 'personLocation',
      fields: {
        isHome: FieldType.BOOLEAN,
      },
      tags: ['person'],
    },
  ],
});

influx
  .getDatabaseNames()
  .then(names => {
    if (names.indexOf(DB_NAME) === -1) {
      return influx.createDatabase(DB_NAME);
    }

    return;
  })
  .then(() => {
    log('[influxdb] Connected to InfluxDB');
  })
  .catch(err => {
    error('[influxdb] Error creating Influx database!', err);
  });

const storeMeasurementData = (
  valueType: string,
  value: number,
  tags: { [tag: string]: string },
) =>
  influx
    .writeMeasurement(valueType, [
      {
        tags,
        fields: { [valueType]: value },
      },
    ])
    .then(() => {
      log(
        `[influxdb] Stored data to InfluxDB: [${valueType}] ${value} @ ${tags.location}`,
      );
    })
    .catch(err => {
      error(`[influxdb] Error saving data to InfluxDB! ${err.stack}`);
      throw new Error('Error saving data to InfluxDB!');
    });

export const permanentStorageHandler = (
  type: string,
  value: string,
  location: string,
) => {
  switch (type) {
    case 'temperature':
    case 'pressure':
    case 'humidity':
    case 'light':
      return storeMeasurementData(type, parseFloat(value), { location });
    default:
      error(`[influxdb] Unknown sensor type ${type}`);
      throw new Error(`Unknown sensor type ${type}`);
  }
};

export const storeAction = (action: AutomationAction) => {
  const manual = !!action.manual;

  switch (action.command) {
    case AutomationActionCommand.ENABLE_DEVICE:
    case AutomationActionCommand.DISABLE_DEVICE:
      const group = action.target;
      const enabled = action.command === AutomationActionCommand.ENABLE_DEVICE;

      return influx
        .writeMeasurement('switchedLight', [
          {
            tags: { group, manual: manual.toString() },
            fields: { enabled },
          },
        ])
        .then(() => {
          log(
            `[influxdb] Stored data to InfluxDB: [switchedLight] ${enabled}, group ${group}, manual ${manual}`,
          );
        })
        .catch(err => {
          error(
            `[influxdb] Error saving action data to InfluxDB! ${err.stack}`,
          );
          throw new Error('Error saving action data to InfluxDB!');
        });
    default:
      throw new Error(`Unable to store unknown action type: ${action.command}`);
  }
};

export const storeLocationChange = (person: string, isHome: boolean) =>
  influx
    .writeMeasurement('personLocation', [
      {
        tags: { person },
        fields: { isHome },
      },
    ])
    .then(() => {
      log(
        `[influxdb] Stored data to InfluxDB: [personLocation] ${person}, isHome ${isHome}`,
      );
    })
    .catch(err => {
      error(`[influxdb] Error saving location data to InfluxDB! ${err.stack}`);
      throw new Error('Error saving location data to InfluxDB!');
    });
