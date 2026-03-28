/**
 * CivicEye — Tabs Layout
 * File: app/(tabs)/_layout.tsx
 *
 * FIXES:
 *  1. Added useEffect route guard — when user becomes null (after logout),
 *     staff are sent to /(auth)/staff-login, citizens to /(auth)/login.
 *     Without this guard, logout() just cleared state but nothing navigated.
 *  2. isStaff flag remembered before user is cleared so we navigate to the
 *     correct login screen (staff-login vs login).
 */

import React, { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const C = {
  navy: '#1A2E4A', blue: '#4BB8E8', textMuted: '#6B7A96',
  white: '#FFFFFF', border: '#E2E8F0', sosBg: '#E53935', sosText: '#FFFFFF',
  orange: '#F5A623',
};

function SosIcon() {
  return (
    <View style={styles.sosWrap}>
      <View style={styles.sosBubble}>
        <Text style={styles.sosLabel}>SOS</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { isStaff, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  // ✅ FIX: remember whether this session was a staff session
  // We need this because by the time we read isStaff after logout() it's
  // already been set to false — so we capture it before logout happens.
  const wasStaffRef = useRef(isStaff);
  useEffect(() => {
    if (isStaff) wasStaffRef.current = true;
    if (!isStaff && isLoggedIn) wasStaffRef.current = false;
  }, [isStaff, isLoggedIn]);

  // ✅ FIX: Route guard — runs whenever auth state changes.
  // When user logs out (isLoggedIn becomes false), redirect to the
  // correct login screen based on what kind of session it was.
  useEffect(() => {
    if (isLoading) return;  // wait for session restore before redirecting

    if (!isLoggedIn) {
      if (wasStaffRef.current) {
        // Staff logged out → go to staff login page
        router.replace('/(auth)/staff-login');
      } else {
        // Citizen logged out → go to citizen login page
        router.replace('/(auth)/login');
      }
    }
  }, [isLoggedIn, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: isStaff ? C.orange : C.navy,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      {/* ═══ STAFF TABS ═══ */}
      <Tabs.Screen
        name="staff_dashboard"
        options={
          isStaff
            ? {
                title: 'Dashboard',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="staff_reports"
        options={
          isStaff
            ? {
                title: 'Reports',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="staff_profile"
        options={
          isStaff
            ? {
                title: 'Profile',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
                ),
              }
            : { href: null }
        }
      />

      {/* ═══ CITIZEN TABS ═══ */}
      <Tabs.Screen
        name="dashboard"
        options={
          !isStaff
            ? {
                title: 'Home',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="report"
        options={
          !isStaff
            ? {
                title: 'Report',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons name={focused ? 'camera' : 'camera-outline'} size={24} color={color} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="sos"
        options={
          !isStaff
            ? {
                title: '',
                tabBarIcon: () => <SosIcon />,
                tabBarLabel: () => null,
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="track"
        options={
          !isStaff
            ? {
                title: 'Track',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons name={focused ? 'location' : 'location-outline'} size={24} color={color} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="profile"
        options={
          !isStaff
            ? {
                title: 'Profile',
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                ),
              }
            : { href: null }
        }
      />

      {/* Always hidden */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sosWrap:   { alignItems: 'center', justifyContent: 'center', marginBottom: Platform.OS === 'ios' ? 0 : 4 },
  sosBubble: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: C.sosBg,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.sosBg, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8, marginTop: -20,
  },
  sosLabel: { color: C.sosText, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});