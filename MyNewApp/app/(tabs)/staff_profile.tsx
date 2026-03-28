/**
 * CivicEye — Staff Profile Screen (Refined)
 * File: app/(tabs)/staff_profile.tsx
 *
 * REFINEMENTS:
 * - Replaced "CivicEye" text with logo image from assets/images/civiceye_log.png
 * - Replaced emoji icons with professional Lucide-style icons (using Ionicons/MaterialIcons standard in Expo/React Native)
 * - Removed "Your Capabilities" section
 * - Updated TITLE color to primary color: #1A2B4C
 */

import React, { useState } from 'react';
import {
  Alert, Image, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
// Note: Assuming standard Expo vector icons are available. 
// If using a different library, these can be swapped for SVG or Image components.
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const C = {
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceHigh: '#F0F4F8',
  white: '#FFFFFF',
  navy: '#1A2B4C',         // Updated Primary Color as requested
  navyLight: '#718096',
  blue: '#4A90E2',
  blueDark: '#357ABD',
  blueLight: '#EBF4FF',
  orange: '#F5A623',
  green: '#27AE60',
  red: '#E53935',
  border: '#E2E8F0',
  textPrimary: '#1A2B4C',  // Updated to #1A2B4C
  textSecondary: '#4A5568',
  textMuted: '#718096',
};

// Professional Icon Mapping for Departments
const DEPT_CONFIG: Record<string, { icon: any; label: string; color: string; bgColor: string; iconType: 'ion' | 'material' }> = {
  electricity: { icon: 'flash',        label: 'Electricity Department', color: '#F5A623', bgColor: '#F5A62315', iconType: 'ion' },
  water:       { icon: 'water',        label: 'Water Department',       color: '#4A90E2', bgColor: '#4A90E215', iconType: 'ion' },
  garbage:     { icon: 'trash-outline', label: 'Garbage Department',     color: '#27AE60', bgColor: '#27AE6015', iconType: 'ion' },
  roads:       { icon: 'road-variant', label: 'Roads Department',       color: '#E67E22', bgColor: '#E67E2215', iconType: 'material' },
  fire:        { icon: 'fire',         label: 'Fire Department',        color: '#E53935', bgColor: '#E5393515', iconType: 'material' },
  vandalism:   { icon: 'alert-circle', label: 'Vandalism Department',   color: '#9B59B6', bgColor: '#9B59B615', iconType: 'ion' },
  other:       { icon: 'business',     label: 'General Department',     color: '#6B7A96', bgColor: '#6B7A9615', iconType: 'ion' },
};

export default function StaffProfileScreen() {
  const { user, logout, department } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const deptKey = (department || 'other').toLowerCase();
  const deptCfg = DEPT_CONFIG[deptKey] || DEPT_CONFIG.other;
  const deptName = department || 'Department';
  const displayDept = deptName.charAt(0).toUpperCase() + deptName.slice(1).replace('_', ' ');

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of the staff portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } catch (e: any) {
            Alert.alert('Logout Error', e.message ?? 'Could not log out. Please try again.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';
  const joined = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const renderDeptIcon = (size = 18, color = deptCfg.color) => {
    if (deptCfg.iconType === 'material') {
      return <MaterialCommunityIcons name={deptCfg.icon} size={size} color={color} />;
    }
    return <Ionicons name={deptCfg.icon} size={size} color={color} />;
  };

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header with Logo Image */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Staff Profile</Text>
          <Text style={S.headerSub}>Department Portal</Text>
        </View>
        <Image 
          source={require('../../assets/images/civiceye_log.png')} 
          style={S.logoImage}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

        {/* Avatar + Department Badge */}
        <View style={S.avatarSection}>
          <View style={[S.avatarRing, { borderColor: deptCfg.color }]}>
            <View style={S.avatar}>
              <Text style={S.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={S.email}>{user?.email}</Text>
          <View style={[S.deptBadge, { backgroundColor: deptCfg.bgColor, borderColor: deptCfg.color + '40' }]}>
            {renderDeptIcon(16)}
            <Text style={[S.deptBadgeText, { color: deptCfg.color }]}>{deptCfg.label}</Text>
          </View>
          <View style={S.staffBadge}>
            <MaterialIcons name="verified-user" size={12} color={C.navy} style={{ marginRight: 4 }} />
            <Text style={S.staffBadgeText}>Staff Account</Text>
          </View>
        </View>

        {/* Department Info Card */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={[S.cardIconWrap, { backgroundColor: deptCfg.bgColor }]}>
              {renderDeptIcon(20)}
            </View>
            <Text style={S.cardTitle}>Department Details</Text>
          </View>
          <View style={S.row}>
            <Text style={S.rowLabel}>Department</Text>
            <Text style={[S.rowValue, { color: deptCfg.color }]}>{displayDept}</Text>
          </View>
          <View style={S.divider} />
          <View style={S.row}>
            <Text style={S.rowLabel}>Role</Text>
            <Text style={S.rowValue}>Department Staff</Text>
          </View>
          <View style={S.divider} />
          <View style={S.row}>
            <Text style={S.rowLabel}>Access Level</Text>
            <View style={S.accessBadge}>
              <Text style={S.accessText}>Full Access</Text>
            </View>
          </View>
        </View>

        {/* Account Info Card */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={[S.cardIconWrap, { backgroundColor: C.blueLight }]}>
              <Ionicons name="person" size={20} color={C.blue} />
            </View>
            <Text style={S.cardTitle}>Account Details</Text>
          </View>
          <View style={S.row}>
            <Text style={S.rowLabel}>Email</Text>
            <Text style={S.rowValue} numberOfLines={1}>{user?.email}</Text>
          </View>
          <View style={S.divider} />
          <View style={S.row}>
            <Text style={S.rowLabel}>Account Type</Text>
            <Text style={S.rowValue}>Staff</Text>
          </View>
          <View style={S.divider} />
          <View style={S.row}>
            <Text style={S.rowLabel}>Member Since</Text>
            <Text style={S.rowValue}>{joined}</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={S.securityCard}>
          <Ionicons name="shield-checkmark" size={20} color={C.navy} style={{ marginTop: 2 }} />
          <Text style={S.securityText}>
            All staff actions are logged and monitored. Status changes and comments are visible to citizens for full transparency.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[S.logoutBtn, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color={C.white} style={{ marginRight: 8 }} />
          <Text style={S.logoutText}>{loggingOut ? 'Logging out…' : 'Log Out'}</Text>
        </TouchableOpacity>

        <Text style={S.version}>CivicEye Staff Portal v1.0</Text>
        <Text style={S.tagline}>Serving citizens. Managing infrastructure.</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.surface, paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: C.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.navy }, // Color updated to #1A2B4C
  headerSub:   { fontSize: 12, color: C.textMuted, fontWeight: '500', marginTop: 2 },
  logoImage:   { width: 100, height: 40 },
  
  content: { padding: 20 },

  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    backgroundColor: C.surface,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  avatar: {
    width: 86, height: 86, borderRadius: 43, backgroundColor: C.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: C.white },
  email:      { fontSize: 18, fontWeight: '700', color: C.navy, marginBottom: 12 },

  deptBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, marginBottom: 10,
  },
  deptBadgeText: { fontSize: 14, fontWeight: '700' },

  staffBadge:     { backgroundColor: C.navy + '10', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center' },
  staffBadgeText: { fontSize: 12, fontWeight: '700', color: C.navy },

  card: {
    backgroundColor: C.surface, borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle:  { fontSize: 16, fontWeight: '700', color: C.navy },

  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  rowLabel: { fontSize: 14, color: C.textMuted, fontWeight: '500' },
  rowValue: { fontSize: 14, color: C.navy, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  divider:  { height: 1, backgroundColor: C.border, marginVertical: 12 },

  accessBadge: { backgroundColor: C.green + '15', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  accessText:  { fontSize: 11, fontWeight: '700', color: C.green },

  securityCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.navy + '05', borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: C.navy + '10',
  },
  securityText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 },

  logoutBtn: {
    backgroundColor: C.blue, borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: C.white },
  
  version:    { textAlign: 'center', fontSize: 12, color: C.textMuted, fontWeight: '500', marginBottom: 4 },
  tagline:    { textAlign: 'center', fontSize: 11, color: C.textMuted, fontStyle: 'italic' },
});