'use client';

import { useEffect, useRef } from 'react';

/** A field people never see. Bots fill in every input, so anything in it marks the message as spam. */
export function HoneyPot() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Leave this empty
        <input name="hp" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

/** Milliseconds since the form appeared; a person needs a few seconds, a bot doesn't. */
export function useFormTimer() {
  const start = useRef<number>(0);
  useEffect(() => {
    start.current = Date.now();
  }, []);
  return () => (start.current ? Date.now() - start.current : 0);
}
