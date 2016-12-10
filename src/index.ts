import * as Hapi from 'hapi';
import * as Path from 'path';

import { initializeRoutes } from './routes';

const server = new Hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, '..', 'public'),
      },
    },
  },
});

server.connection({
  host: 'localhost',
  port: process.env.PORT || 8080,
});

initializeRoutes(server);

server.start((err) => {
  if (err) { throw err; }
  console.log('Server running at:', server.info.uri); // tslint:disable-line:no-console
});
