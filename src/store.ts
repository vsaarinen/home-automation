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
        light: FieldType.INTEGER,
      },
      tags: [
        'location',
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

const storeData = (valueType: string, value: number, tags: { [tag: string]: string }) => {
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
  });
};

export const storeTemperature = (temperature: number, location: string) => {
  storeData('temperature', temperature, { location });
};

export const storeHumidity = (humidity: number, location: string) => {
  storeData('humidity', humidity, { location });
};

export const storePressure = (pressure: number, location: string) => {
  storeData('pressure', pressure, { location });
};

export const storeLightLevel = (light: number, location: string) => {
  storeData('light', light, { location });
};
