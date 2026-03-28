/**
 * CivicEye — Login / Register Screen
 * File: app/(auth)/login.tsx
 */

import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const C = {
  bg:            '#F0F2F5',
  white:         '#FFFFFF',
  navy:          '#1A2E4A',
  blue:          '#3B82C4',
  blueBtn:       '#4A90D9',
  blueBtnPress:  '#3A7BC8',
  border:        '#D8DDE6',
  borderFocus:   '#4A90D9',
  placeholder:   '#A0AABC',
  text:          '#1A2E4A',
  textMuted:     '#6B7A96',
  error:         '#E53935',
  errorBg:       '#FFEBEE',
  errorBorder:   '#FFCDD2',
  success:       '#2E7D32',
  successBg:     '#E8F5E9',
  successBorder: '#C8E6C9',
  divider:       '#CBD2DC',
  toggleBg:      '#E2E6EC',
  toggleSelBg:   '#FFFFFF',
  toggleInact:   '#8A96A8',
  toggleActive:  '#1A2E4A',
};

// ─── InputField ────────────────────────────────────────────────────────────────
function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  right,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  right?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[S.inputWrap, focused && S.inputWrapFocused]}>
      <Text style={S.inputIcon}>{icon}</Text>
      <TextInput
        style={S.input}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry ?? false}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={C.blue}
        underlineColorAndroid="transparent"
      />
      {right ?? null}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { login, register } = useAuth();

  const [mode,       setMode]       = useState<Mode>('login');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [password2,  setPassword2]  = useState('');
  const [showP,      setShowP]      = useState(false);
  const [showP2,     setShowP2]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [btnPressed, setBtnPressed] = useState(false);

  const switchMode = (m: Mode) => {
    setError('');
    setSuccess('');
    setMode(m);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) return setError('Please enter your email address.');
    if (!password)     return setError('Please enter your password.');
    if (mode === 'register') {
      if (password.length < 8)    return setError('Password must be at least 8 characters.');
      if (password !== password2) return setError('Passwords do not match.');
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, password2);
        setSuccess('Account created! Logging you in…');
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    setError(`${provider === 'google' ? 'Google' : 'Apple'} sign-in coming soon.`);
  };

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <KeyboardAvoidingView
        style={S.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={S.scroll}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* ── Logo ── */}
          <View style={S.logoSec}>
            <Image
              source={require('../../assets/images/logoCiviceye.jpeg')}
              style={S.logoImage}
              resizeMode="contain"
            />
            <Text style={S.tagline}>SEE IT  ·  REPORT IT  ·  FIX IT</Text>
          </View>

          {/* ── Tab toggle ── */}
          <View style={S.toggleWrap}>
            {(['login', 'register'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[S.toggleBtn, mode === m && S.toggleBtnActive]}
                onPress={() => switchMode(m)}
                activeOpacity={0.85}
              >
                <Text style={[S.toggleText, mode === m && S.toggleTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Alerts ── */}
          {!!error && (
            <View style={S.alertError}>
              <Text style={S.alertErrorText}>⚠  {error}</Text>
            </View>
          )}
          {!!success && (
            <View style={S.alertSuccess}>
              <Text style={S.alertSuccessText}>✓  {success}</Text>
            </View>
          )}

          {/* ── Email ── */}
          <InputField
            icon="✉"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <View style={S.gap} />

          {/* ── Password ── */}
          <InputField
            icon="🔒"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showP}
            right={
              <TouchableOpacity
                onPress={() => setShowP(v => !v)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={S.eyeIcon}>{showP ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            }
          />

          {/* ── Confirm Password (register) ── */}
          {mode === 'register' && (
            <>
              <View style={S.gap} />
              <InputField
                icon="🔒"
                placeholder="Confirm Password"
                value={password2}
                onChangeText={setPassword2}
                secureTextEntry={!showP2}
                right={
                  <TouchableOpacity
                    onPress={() => setShowP2(v => !v)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={S.eyeIcon}>{showP2 ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                }
              />
            </>
          )}

          {/* ── Forgot password ── */}
          {mode === 'login' && (
            <TouchableOpacity style={S.forgotRow} activeOpacity={0.7}>
              <Text style={S.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <View style={S.gap} />

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[S.btn, btnPressed && S.btnPressed]}
            onPress={handleSubmit}
            onPressIn={() => setBtnPressed(true)}
            onPressOut={() => setBtnPressed(false)}
            activeOpacity={1}
            disabled={loading}
          >
            <Text style={S.btnText}>
              {loading ? '...' : mode === 'login' ? 'Log in' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* ── Social auth (register only) ── */}
          {mode === 'register' && (
            <View style={S.socialSection}>
              <View style={S.dividerRow}>
                <View style={S.dividerLine} />
                <Text style={S.dividerText}>or</Text>
                <View style={S.dividerLine} />
              </View>
              <Text style={S.socialLabel}>Sign up with</Text>
              <View style={S.socialRow}>
                <TouchableOpacity
                  style={S.socialBtn}
                  onPress={() => handleSocialAuth('google')}
                  activeOpacity={0.8}
                >
                  <Text style={S.googleG}>G</Text>
                  <Text style={S.socialBtnText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.socialBtn}
                  onPress={() => handleSocialAuth('apple')}
                  activeOpacity={0.8}
                >
                  <Text style={S.appleA}></Text>
                  <Text style={S.socialBtnText}>Apple ID</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 72 : 52,
    paddingBottom: 48,
  },

  logoSec: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: width * 0.52,
    height: 80,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: 2,
  },

  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: C.toggleBg,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 7,
  },
  toggleBtnActive: {
    backgroundColor: C.toggleSelBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    color: C.toggleInact,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: C.toggleActive,
    fontWeight: '700',
  },

  alertError: {
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  alertErrorText: {
    color: C.error,
    fontSize: 13,
    fontWeight: '500',
  },
  alertSuccess: {
    backgroundColor: C.successBg,
    borderWidth: 1,
    borderColor: C.successBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  alertSuccessText: {
    color: C.success,
    fontSize: 13,
    fontWeight: '500',
  },

  gap: {
    height: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapFocused: {
    borderColor: C.borderFocus,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 10,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    height: '100%',
    paddingVertical: 0,
  },
  eyeIcon: {
    fontSize: 17,
    marginLeft: 6,
    opacity: 0.6,
  },

  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: '600',
  },

  btn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: C.blueBtn,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnPressed: {
    backgroundColor: C.blueBtnPress,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  socialSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.divider,
  },
  dividerText: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  socialLabel: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 4,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: '#D0D5DE',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    elevation: 2,
  },
  socialBtnText: {
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },
  googleG: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4285F4',
  },
  appleA: {
    fontSize: 16,
    color: '#000000',
  },
});