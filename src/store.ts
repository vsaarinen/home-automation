import { FieldType, InfluxDB } from 'influx';

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

export const storageHandler = (type: string, value: string, location: string) => {
  switch (type) {
    case 'temperature':
    case 'pressure':
    case 'humidity':
    case 'light':
      return storeMeasurementData(type, parseFloat(value), { location }).then(() => 'ok!');
    default:
      console.error(`Unknown sensor type ${type}`);
      return Promise.reject(new Error(`Unknown sensor type ${type}`));
  }
};

export const storeLightSwitch = (group: string, enabled: boolean, manual = false) =>
  influx.writeMeasurement('lightSwitch', [
    {
      tags: { group, manual: manual.toString() },
      fields: { lightSwitch: enabled },
    },
  ])
  .then(() => {
    console.log(`Stored data to InfluxDB: [lightSwitch] ${enabled}, group ${group}, manual ${manual}`); // tslint:disable-line
  })
  .catch(err => {
    console.error(`Error saving data to InfluxDB! ${err.stack}`);
    throw new Error('Error saving data to InfluxDB!');
  });
