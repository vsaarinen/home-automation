import * as Hapi from 'hapi';
import * as path from 'path';

import { log } from './log';
import { initializeRoutes } from './routes';
import store from './store';
import { initializeTimeBasedActions } from './time';

// SET UP SERVER
const server = new Hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: path.join(__dirname, '..', 'public'),
      },
    },
  },
});

server.connection({
  host: 'localhost',
  port: process.env.PORT || 8080,
});

initializeRoutes(server, store);
initializeTimeBasedActions(store);

// START SERVER
server.start(err => {
  if (err) {
    throw err;
  }
  log('[server] Server running at:', server.info!.uri);
});
