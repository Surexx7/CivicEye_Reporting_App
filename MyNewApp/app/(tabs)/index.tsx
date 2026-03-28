/**
 * CivicEye — Tabs Index Redirect
 * File: app/(tabs)/index.tsx
 *
 * This file redirects to the appropriate screen based on auth state.
 * Prevents showing the default Expo template page.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function TabsIndex() {
  const { isLoggedIn, isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Small timeout to allow the Tabs layout to settle after auth state changes
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        router.replace('/');
      } else if (isStaff) {
        router.replace('/(tabs)/staff_dashboard');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isLoggedIn, isStaff]);

  return null;
}
