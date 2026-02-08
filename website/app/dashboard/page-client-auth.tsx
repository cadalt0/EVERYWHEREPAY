"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

export default function DashboardAuthChecker() {
  const router = useRouter();
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to access the dashboard.',
        variant: 'destructive',
      });
      router.push('/auth/login');
    }
  }, [router]);
  return null;
}
