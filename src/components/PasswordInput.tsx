'use client';

import { useState } from 'react';

/** Password box with an eye button to show or hide what's typed. Used for every password field. */
export default function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={show ? 'text' : 'password'} className="field pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        title={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted transition-colors hover:text-brand-green focus-visible:text-brand-green focus-visible:outline-none"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {show ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c5 0 9 4.5 10 7-0.4 1-1.3 2.4-2.6 3.7M6.6 6.6C4.4 8 2.8 10.1 2 12c1 2.5 5 7 10 7 1.8 0 3.4-.6 4.8-1.4" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          ) : (
            <>
              <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </span>
  );
}
