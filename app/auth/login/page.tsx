'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { oauthSignIn } from '@/lib/google-oauth';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();

  // Replace with your actual Google OAuth client ID and redirect URI
  const GOOGLE_CLIENT_ID = '717715214790-o6m0ilobt48k8neig4c1vvuip1566mhb.apps.googleusercontent.com';
    // Restore demo login for Demo Account and Sign up
    const handleLogin = () => {
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      }));
      router.push('/dashboard');
    };
  const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' ? window.location.origin + '/auth/login' : '';
  const GOOGLE_SCOPES = [
    'openid',
    'profile', // Requests name
    'email',   // Requests Gmail address
  ];

  const [googleLoading, setGoogleLoading] = useState(false);
  const handleGoogleLogin = () => {
    oauthSignIn({
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: GOOGLE_REDIRECT_URI,
      scopes: GOOGLE_SCOPES,
      state: 'login',
    });
  };

  // Handle Google OAuth callback on this page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 1. Check for user in localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      // Always show toast and delay redirect, even on first render
      setTimeout(() => {
        toast({
          title: 'Recent login found',
          description: 'Auto logging in ...',
          variant: 'default',
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 300);
      }, 100); // slight delay to ensure Toaster is mounted
      return;
    } else {
      setTimeout(() => {
        toast({
          title: 'Login not found',
          description: 'Please login to continue.',
          variant: 'destructive',
        });
      }, 100);
    }
    // 2. Handle Google OAuth callback
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
      setGoogleLoading(true);
      // Remove the token from the URL for cleanliness
      window.history.replaceState(null, '', window.location.pathname);
      fetch('https://www.googleapis.com/oauth2/v3/userinfo?access_token=' + accessToken)
        .then(res => res.json())
        .then(async user => {
          try {
            // 1. Check if user exists in DB
            const checkRes = await fetch('/api/circle/check-user-exists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email }),
            });
            const checkData = await checkRes.json();
            if (checkData.exists) {
              // Save user info to localStorage
              localStorage.setItem('user', JSON.stringify(user));
              router.push('/dashboard');
              return;
            }
            // 2. Create Circle wallets (backend) if not exists
            const walletRes = await fetch('/api/circle/create-wallets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: user.email }),
            });
            const walletData = await walletRes.json();
            if (!walletRes.ok || walletData?.dbResponse?.error) {
              throw new Error(
                walletData?.dbResponse?.error?.error ||
                walletData?.dbResponse?.error ||
                walletData?.error ||
                'Failed to create Circle wallets or save to DB'
              );
            }
            // Save user info to localStorage
            localStorage.setItem('user', JSON.stringify(user));
            // 3. Only redirect if all succeed
            router.push('/dashboard');
          } catch (err) {
            setGoogleLoading(false);
            toast({
              title: 'Login failed',
              description: err instanceof Error ? err.message : 'Unknown error',
              variant: 'destructive',
            });
          }
        });
    }
  }, [router]);

  // Log user info from Google after redirect (on /dashboard)
  if (typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-2xl font-mono tracking-tighter hover:opacity-80 transition-opacity">
            EVERYWHEREPAY
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image (Hidden on mobile) */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/login1.png"
                alt="Login illustration"
                className="scale-[1.7] w-full h-auto object-contain"
                style={{ WebkitMaskImage: 'radial-gradient(circle at 40% 60%, black 70%, transparent 100%)', maskImage: 'radial-gradient(circle at 40% 60%, black 70%, transparent 100%)' }}
              />
            </div>
          </div>
          {/* Right: Login Box */}
          <div className="max-w-sm w-full mx-auto lg:mx-0">
            <div className="mb-8 text-center">
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent font-mono text-xs rounded-full tracking-wide">
                Built for peoples that move fast.
              </span>
            </div>
            <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
              <div className="mb-8">
                <h1 className="text-3xl font-bold font-mono mb-2">Welcome back</h1>
                <p className="text-muted-foreground">Sign in to your account to continue</p>
              </div>

              <button
                type="button"
                onClick={googleLoading ? undefined : handleGoogleLogin}
                disabled={googleLoading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold font-mono mb-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                style={{ pointerEvents: googleLoading ? 'none' : 'auto' }}
              >
                <span className="flex items-center gap-2 w-full justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Logging in...' : 'Continue with Google'}</span>
                </span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Or continue as demo</span>
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="w-full py-3 border border-border rounded-lg font-bold font-mono hover:bg-muted transition-colors"
              >
                Demo Account
              </button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{' '}
                <button onClick={handleGoogleLogin} className="text-accent hover:underline font-semibold">
                  Sign up
                </button>
              </p>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="font-mono text-lg font-bold mb-1">$███M+</div>
                <div className="text-xs text-muted-foreground">Total Volume</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold mb-1">███K+</div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold mb-1">5s</div>
                <div className="text-xs text-muted-foreground">Avg Speed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
