// This file demonstrates the correct way to get Google user info after OAuth login
// using the access_token from the URL fragment, as per Google docs.
// https://developers.google.com/identity/sign-in/web/sign-in

'use client';
import { useEffect } from 'react';

export default function GoogleUserLogger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
      // Remove the token from the URL for cleanliness
      window.history.replaceState(null, '', window.location.pathname);
      // Fetch user info from Google
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(res => res.json())
        .then(user => {
          // Log name and email to console
          console.log('Google User Name:', user.name);
          console.log('Google User Email:', user.email);
        });
    }
  }, []);
  return null;
}
