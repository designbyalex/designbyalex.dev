import * as React from 'react';

const subscribeNever = () => () => {};

/**
 * True for the server render and the hydration pass, false for any render that
 * starts on the client (a client-side navigation) and after hydration. Used to
 * ship an inline script in the server HTML only: React never runs scripts it
 * renders itself, so on the client the element is left out.
 */
export const useIsServerRender = () =>
  React.useSyncExternalStore(
    subscribeNever,
    () => false,
    () => true
  );
