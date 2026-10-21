import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * `false` on the server and during hydration, `true` from the first post-hydration render.
 * Lets a component render exactly what the server did (which can't read `matchMedia`) until
 * React has attached, then switch to the client-only value without a hydration mismatch.
 */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);
