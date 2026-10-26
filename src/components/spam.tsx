'use client';

import { useEffect, useRef } from 'react';

/**
 * A field people never see or hear (no label, not shown, skipped by keyboard and screen readers).
 * Bots tend to fill in every input they find, so anything in it marks the message as spam.
 */
export function HoneyPot() {
  return <input type="text" name="hp" tabIndex={-1} autoComplete="off" defaultValue="" aria-hidden="true" style={{ display: 'none' }} />;
}

/** Milliseconds since the form appeared; a person needs a few seconds, a bot doesn't. */
export function useFormTimer() {
  const start = useRef<number>(0);
  useEffect(() => {
    start.current = Date.now();
  }, []);
  return () => (start.current ? Date.now() - start.current : 0);
}
