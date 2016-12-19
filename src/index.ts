import * as Hapi from 'hapi';
import * as Path from 'path';
import { createStore, Store, Unsubscribe } from 'redux';

const { AsyncNodeStorage } = require('redux-persist-node-storage');
const { persistStore, autoRehydrate } = require('redux-persist');

import { clearActionsToTake } from './actions';
import { error, log } from './log';
import reducer, { State } from './reducer';
import { AutomationAction, AutomationActionCommand, takeActions } from './remote';
import { initializeRoutes } from './routes';
import { dawnS, duskS } from './time';

// SET UP STORE
const store = createStore<State>(reducer, undefined as any, autoRehydrate());
persistStore(store, { storage: new AsyncNodeStorage('/tmp/storageDir') });

// Based on https://github.com/reactjs/redux/issues/303#issuecomment-125184409
const observeStore = <T>(
  theStore: Store<State>,
  selector: (state: State) => T,
  onChange: (selectedState: T) => void,
): Unsubscribe => {
  let currentState: T;

  const handleChange = () => {
    let nextState = selector(theStore.getState());
    if (nextState !== currentState) {
      currentState = nextState;
      onChange(currentState);
    }
  };

  let unsubscribe = theStore.subscribe(handleChange);
  handleChange();
  return unsubscribe;
};

const handleActionsToTake = (actionsToTake: AutomationAction[]) => {
  if (actionsToTake.length > 0) {
    const actions = [...actionsToTake];
    store.dispatch(clearActionsToTake());
    takeActions(actions)
      .catch((e: any) => { error(`[redux-state] Taking ${actions.length} actions failed: ${JSON.stringify(e)}`); });
  }
};

// Returns an unsubscribe function if needed
observeStore(store, (s: State) => s.actionsToTake, handleActionsToTake);

// SET UP SERVER
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

initializeRoutes(server, store);

// SET UP TIME-BASED ACTIONS
// Automatically turn off outer lights
dawnS.forEach(() => {
  const externalLightGroup = '3';
  const action: AutomationAction = {
    command: AutomationActionCommand.DISABLE_LIGHT,
    target: externalLightGroup,
  };
  takeActions([action])
    .catch(() => { error('[external-light] Unable to disable external light'); });
});

// Automatically turn on outer lights
duskS.forEach(() => {
  const externalLightGroup = '3';
  const action: AutomationAction = {
    command: AutomationActionCommand.ENABLE_LIGHT,
    target: externalLightGroup,
  };
  takeActions([action])
    .catch(() => { error('[external-light] Unable to enable external light'); });
});

// START SERVER
server.start((err) => {
  if (err) { throw err; }
  log('[server] Server running at:', server.info.uri);
});
