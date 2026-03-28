/**
 * CivicEye — Staff Login Screen
 * File: app/(auth)/staff-login.tsx
 * UI redesigned to match CivicEye brand (light theme, navy + sky-blue palette)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';

// ── Brand palette pulled from CivicEye logo & user-login UI ──────────────────
const C = {
  bg:            '#F0F4F8',          // same light grey background as user login
  surface:       '#FFFFFF',          // white card
  surfaceAlt:    '#EAF2FB',          // very light blue tint
  border:        '#C8DCF0',          // soft blue border
  navy:          '#1A2E4A',          // logo dark navy
  navyLight:     '#243C57',
  blue:          '#4BB8E8',          // logo sky-blue
  blueDark:      '#2A8FC0',
  white:         '#FFFFFF',
  textPrimary:   '#1A2E4A',          // navy for headings
  textSecondary: '#4A6880',
  textMuted:     '#8AACC8',
  error:         '#E05555',
  errorBg:       'rgba(224,85,85,0.08)',
};

// ── Reusable input field ──────────────────────────────────────────────────────
function SecureField({
  label, value, onChangeText, placeholder,
  secureTextEntry = false, icon,
}: {
  label: string; value: string;
  onChangeText: (t: string) => void;
  placeholder: string; secureTextEntry?: boolean; icon: string;
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.blue],
  });

  return (
    <View style={F.wrap}>
      <Text style={F.label}>{label}</Text>
      <Animated.View style={[F.inputRow, { borderColor }]}>
        <FontAwesome name={icon as any} size={20} color={C.textMuted} style={F.icon} />
        <TextInput
          style={F.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          secureTextEntry={secureTextEntry && !visible}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
          selectionColor={C.blue}
          underlineColorAndroid="transparent"
          textContentType={secureTextEntry ? 'password' : 'username'}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setVisible(v => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FontAwesome name={visible ? 'eye-slash' : 'eye'} size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const F = StyleSheet.create({
  wrap:     { marginBottom: 16 },
  label:    {
    fontSize: 11, fontWeight: '700', color: C.textSecondary,
    letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, height: 52,
  },
  icon:  { fontSize: 16, marginRight: 10, opacity: 0.55 },
  input: {
    flex: 1, fontSize: 15, color: C.textPrimary,
    fontWeight: '500', height: '100%', paddingVertical: 0,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function StaffLoginScreen() {
  const { staffLogin } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const logoAnim    = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide   = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(formSlide,   { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!username.trim()) { setError('Username is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }

    setLoading(true);
    try {
      await staffLogin(username.trim(), password.trim());
      router.replace('/(tabs)/staff_dashboard' as any);
    } catch (err: any) {
      setError(err.message ?? 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={S.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >


        {/* Logo + Brand header — mirrors user login top section */}
        <Animated.View style={[S.headerWrap, {
          opacity: logoAnim,
          transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }]}>
          <Image source={require("../../assets/images/civiceye_log.png")} style={S.logoImage} />

          <View style={S.brandRow}>
            <Text style={S.brandCivic}>Civic</Text>
            <Text style={S.brandEye}>Eye</Text>
          </View>
          <Text style={S.tagline}>SEE IT  •  REPORT IT  •  FIX IT</Text>
        </Animated.View>





        {/* Sign In / Create Account tabs */}
        <Animated.View style={[S.tabContainer, { opacity: formOpacity }]}>
          <TouchableOpacity style={[S.tabButton, S.tabButtonActive, { flex: 1 }]}>
            <Text style={S.tabButtonTextActive}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Form card */}
        <Animated.View style={[S.card, {
          opacity: formOpacity,
          transform: [{ translateY: formSlide }],
        }]}>
          {!!error && (
            <View style={S.errorBox}>
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text style={S.errorText}>{error}</Text>
            </View>
          )}

          <SecureField
            label="Email Address"
            icon="envelope"
            placeholder="Enter your email address"
            value={username}
            onChangeText={t => { setUsername(t); setError(''); }}
          />

          <SecureField
            label="Password"
            icon="lock"
            placeholder="Enter your password"
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            secureTextEntry
          />

          <TouchableOpacity
            style={[S.loginBtn, (!username || !password || loading) && S.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={!username || !password || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <Text style={S.loginBtnText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={S.forgotPwBtn} onPress={() => router.replace("/(auth)/forgot-password" as any)}>
            <Text style={S.forgotPwText}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animated.View>


      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: {
    flexGrow: 1, paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 40,
  },



  // Header
  headerWrap: { alignItems: 'center', marginBottom: 20 },

  // Logo Image
  logoImage: {
    width: 120, // Adjust width as needed
    height: 120, // Adjust height as needed
    resizeMode: 'contain',
    marginBottom: 14,
  },

  // Brand name
  brandRow:   { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  brandCivic: { fontSize: 30, fontWeight: '800', color: C.navy, letterSpacing: 0.2 },
  brandEye:   { fontSize: 30, fontWeight: '800', color: C.blue, letterSpacing: 0.2 },
  tagline:    { fontSize: 11, color: C.textMuted, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },





  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    marginBottom: 24,
    padding: 4,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: C.navy,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textSecondary,
  },
  tabButtonTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 28,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.errorBg,
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: C.error + '40',
  },
  errorText: { flex: 1, color: C.error, fontSize: 13, fontWeight: '600' },

  // Login button — blue, matching user login "Log in" button
  loginBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.blue,
    borderRadius: 12, height: 52, marginTop: 4,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.45 },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: C.white, letterSpacing: 0.3 },

  forgotPwBtn: { alignSelf: 'center', marginTop: 18, padding: 6 },
  forgotPwText: { fontSize: 13, color: C.textSecondary, fontWeight: '600' },
});