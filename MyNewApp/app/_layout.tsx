/**
 * CivicEye — Root Layout
 * File: app/_layout.tsx
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

function Guard() {
  const { isLoggedIn, isLoading, isStaff } = useAuth();
  const router   = useRouter();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (isLoading) return;

    const inAuth    = segments[0] === '(auth)';
    const inTabs    = segments[0] === '(tabs)';
    const inWelcome = segments.length === 0 || segments[0] === 'index';

    if (!isLoggedIn) {
      // Not logged in — force redirect to welcome page from any protected route
      if (inTabs || (!inWelcome && !inAuth)) {
        // Use setTimeout to ensure state has settled before navigating
        setTimeout(() => {
          router.replace('/' as any);
        }, 100);
      }
    } else if (isLoggedIn && (inWelcome || inAuth)) {
      // Already logged in — skip welcome/login screens
      router.replace(isStaff ? '/(tabs)/staff_dashboard' as any : '/(tabs)/dashboard' as any);
    }
  }, [isLoggedIn, isLoading, isStaff, segments]);

  return null;
}

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashDot} />
      <ActivityIndicator size="large" color="#26B5C8" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  return (
    <>
      <Guard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"  options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash:    { flex: 1, backgroundColor: '#0D2B45', alignItems: 'center', justifyContent: 'center', gap: 20 },
  splashDot: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1B8A9A', opacity: 0.9 },
});