// app/auth/callback/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
      // Remove the token from the URL for cleanliness
      window.history.replaceState(null, '', window.location.pathname);
      // Fetch user info from Google
      fetch('https://www.googleapis.com/oauth2/v3/userinfo?access_token=' + accessToken)
        .then(res => res.json())
        .then(async user => {
          // Push to backend
          await fetch('/api/auth/google-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gmail: user.email }),
          });
          // Redirect to dashboard
          router.push('/dashboard');
        });
    } else {
      // If no token, redirect to login
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg font-mono">Logging you in...</div>
    </div>
  );
}
