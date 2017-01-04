import { createStore, Store, Unsubscribe } from 'redux';

const { AsyncNodeStorage } = require('redux-persist-node-storage');
const { persistStore, autoRehydrate } = require('redux-persist');

import { clearActionsToTake } from './actions';
import { error } from './log';
import reducer, { State } from './reducer';
import { AutomationAction, takeActions } from './remote';

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

export default store;
