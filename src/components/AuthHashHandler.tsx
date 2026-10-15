'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';

/**
 * Supabase's default invite and password-reset emails send people back to the site with the
 * sign-in details after a "#" in the address (e.g. barodsglobal.com/#access_token=…&type=invite).
 * This picks them up on any page, signs the person in, and takes them to choose a password.
 * It means the email templates don't have to be edited.
 */
export default function AuthHashHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const p = new URLSearchParams(hash.slice(1));

    if (p.get('error')) {
      window.location.replace('/login?error=link-expired');
      return;
    }
    const access_token = p.get('access_token');
    const refresh_token = p.get('refresh_token');
    if (!access_token || !refresh_token) return;

    const type = p.get('type');
    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) return window.location.replace('/login?error=link-expired');
        window.location.replace(type === 'invite' || type === 'recovery' ? '/portal/set-password' : '/portal');
      });
  }, []);

  return null;
}
