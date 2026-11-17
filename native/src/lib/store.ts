import { useSyncExternalStore } from 'react';

/** Piccolo store reattivo: niente librerie esterne, solo useSyncExternalStore. */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  const get = () => state;
  const set = (patch: Partial<T> | ((s: T) => Partial<T>)) => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    subs.forEach(fn => fn());
  };
  const subscribe = (fn: () => void) => {
    subs.add(fn);
    return () => { subs.delete(fn); };
  };
  /** Il selettore deve restituire valori stabili (parti dello stato, non oggetti nuovi). */
  function use<S>(selector: (s: T) => S): S {
    return useSyncExternalStore(subscribe, () => selector(state));
  }
  return { get, set, subscribe, use };
}
