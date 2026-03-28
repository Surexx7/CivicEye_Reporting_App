/**
 * CivicEye — Profile Screen
 * File: app/(tabs)/profile.tsx
 */

import React, { useState } from 'react';
import {
  Alert, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const C = {
  bg: '#F0F2F5', white: '#FFFFFF', navy: '#1A2E4A',
  blue: '#4BB8E8', blueDark: '#3A90C4', blueLight: '#E8F5FC',
  green: '#27AE60', greenLight: '#E8F8EE',
  red: '#E53935', redLight: '#FFEBEE',
  border: '#E2E8F0', textMuted: '#6B7A96',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try { await logout(); } finally { setLoggingOut(false); }
        },
      },
    ]);
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';
  const joined  = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={S.header}>
        <Text style={S.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={S.content}>

        {/* Avatar */}
        <View style={S.avatarSection}>
          <View style={S.avatar}>
            <Text style={S.avatarText}>{initial}</Text>
          </View>
          <Text style={S.email}>{user?.email}</Text>
          <Text style={S.joined}>Member since {joined}</Text>
          <View style={S.citizenBadge}>
            <Text style={S.citizenBadgeText}>🏙️ Citizen Account</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={S.card}>
          <Text style={S.cardTitle}>Account Details</Text>
          <View style={S.row}>
            <Text style={S.rowLabel}>Email</Text>
            <Text style={S.rowValue}>{user?.email}</Text>
          </View>
          <View style={S.divider} />
          <View style={S.row}>
            <Text style={S.rowLabel}>Account Type</Text>
            <Text style={S.rowValue}>Citizen</Text>
          </View>
          <View style={S.divider} />
          <View style={S.row}>
            <Text style={S.rowLabel}>Member Since</Text>
            <Text style={S.rowValue}>{joined}</Text>
          </View>
        </View>

        {/* App info */}
        <View style={S.card}>
          <Text style={S.cardTitle}>About CivicEye</Text>
          <Text style={S.aboutText}>
            CivicEye empowers citizens to report civic issues directly to the responsible departments.
            AI automatically detects the issue type and routes your report instantly.
          </Text>
          <View style={S.featureRow}>
            {['🤖 AI Detection', '📍 GPS Routing', '🏢 Dept. Alerts', '🆘 SOS Mode'].map(f => (
              <View key={f} style={S.featureChip}>
                <Text style={S.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[S.logoutBtn, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          <Text style={S.logoutText}>{loggingOut ? 'Logging out…' : '🚪  Log Out'}</Text>
        </TouchableOpacity>

        <Text style={S.version}>CivicEye v1.0  ·  SEE IT · REPORT IT · FIX IT</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  { backgroundColor: C.white, paddingHorizontal: 18, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 3 },
  title:   { fontSize: 20, fontWeight: '800', color: C.navy },
  content: { padding: 16 },

  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 4 },
  avatarText:    { fontSize: 34, fontWeight: '800', color: C.white },
  email:         { fontSize: 17, fontWeight: '700', color: C.navy, marginBottom: 4 },
  joined:        { fontSize: 13, color: C.textMuted, marginBottom: 10 },
  citizenBadge:  { backgroundColor: C.blueLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  citizenBadgeText: { fontSize: 13, fontWeight: '700', color: C.blueDark },

  card:       { backgroundColor: C.white, borderRadius: 16, padding: 18, marginBottom: 14, elevation: 2 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: C.navy, marginBottom: 14 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel:   { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  rowValue:   { fontSize: 13, color: C.navy, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider:    { height: 1, backgroundColor: C.border, marginVertical: 8 },
  aboutText:  { fontSize: 13, color: C.textMuted, lineHeight: 20, marginBottom: 14 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip:{ backgroundColor: C.blueLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  featureText:{ fontSize: 11, color: C.blueDark, fontWeight: '600' },

  logoutBtn:  { backgroundColor: C.redLight, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: C.red + '44' },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.red },
  version:    { textAlign: 'center', fontSize: 11, color: C.textMuted },
});