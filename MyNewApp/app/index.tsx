/**
 * CivicEye — Welcome / Role Selection Screen
 * File: app/index.tsx
 *
 * Shown to unauthenticated users on first launch.
 * Citizen  → /(auth)/login
 * Staff    → /(auth)/staff-login
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated, Dimensions, Image, Platform,
  Pressable, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const C = {
  navy:      '#1A2E4A',
  navyDeep:  '#0F1E33',
  navyMid:   '#2C4A72',
  blue:      '#4BB8E8',
  offWhite:  '#F0F2F5',
  textMuted: '#8FA3BF',
  orange:    '#F5A623',
  white:     '#FFFFFF',
};

// ─── Animated Role Card ───────────────────────────────────────────────────────
function RoleCard({ emoji, title, subtitle, accentColor, delay, onPress }: {
  emoji: string; title: string; subtitle: string;
  accentColor: string; delay: number; onPress: () => void;
}) {
  const slideY  = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY,  { toValue: 0, duration: 550, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 550, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  return (
    <Animated.View style={[RC.wrap, { opacity, transform: [{ translateY: slideY }, { scale }] }]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={RC.pressable}>
        <View style={[RC.accentBar, { backgroundColor: accentColor }]} />
        <View style={RC.content}>
          <View style={[RC.iconBubble, { backgroundColor: accentColor + '1A' }]}>
            <Text style={RC.emoji}>{emoji}</Text>
          </View>
          <View style={RC.textWrap}>
            <Text style={RC.title}>{title}</Text>
            <Text style={RC.subtitle}>{subtitle}</Text>
          </View>
          <View style={[RC.arrowWrap, { backgroundColor: accentColor + '1A' }]}>
            <Text style={[RC.arrowText, { color: accentColor }]}>›</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const RC = StyleSheet.create({
  wrap:       { marginBottom: 14, borderRadius: 20, backgroundColor: C.white, shadowColor: '#0F1E33', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6, overflow: 'hidden' },
  pressable:  { flexDirection: 'row', alignItems: 'center' },
  accentBar:  { width: 5, alignSelf: 'stretch' },
  content:    { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  iconBubble: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emoji:      { fontSize: 26 },
  textWrap:   { flex: 1 },
  title:      { fontSize: 17, fontWeight: '800', color: C.navy, marginBottom: 3 },
  subtitle:   { fontSize: 13, color: C.textMuted, fontWeight: '500', lineHeight: 18 },
  arrowWrap:  { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  arrowText:  { fontSize: 24, fontWeight: '300', marginTop: -2 },
});

// ─── Decorative blob ──────────────────────────────────────────────────────────
function Blob({ size, top, left, opacity }: { size: number; top: number; left: number; opacity: number }) {
  return <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: C.blue, top, left, opacity }} />;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router = useRouter();

  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const tagSlide    = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(tagSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navyDeep} />

      {/* ── Hero gradient ── */}
      <LinearGradient
        colors={[C.navyDeep, C.navyMid, C.navy]}
        style={S.hero}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        <Blob size={140} top={-45} left={-50}          opacity={0.06} />
        <Blob size={90}  top={10}  left={width - 70}   opacity={0.08} />
        <Blob size={55}  top={160} left={width * 0.42} opacity={0.05} />

        {/* Logo + brand */}
        <Animated.View style={[S.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={S.logoBubble}>
            <Image
              source={require('../assets/images/logoCiviceye.jpeg')}
              style={S.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={S.brand}>CivicEye</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: tagOpacity, transform: [{ translateY: tagSlide }] }}>
          <Text style={S.tagline}>Empowering communities,</Text>
          <Text style={S.tagline}>one report at a time.</Text>
        </Animated.View>

        {/* Curve into body */}
        <View style={S.curve} />
      </LinearGradient>

      {/* ── Cards ── */}
      <View style={S.body}>
        <Text style={S.chooseLabel}>Choose how to continue</Text>

        <RoleCard
          emoji="🏙️"
          title="Citizen Login"
          subtitle="Report civic issues & track your submissions"
          accentColor={C.blue}
          delay={200}
          onPress={() => router.push('/(auth)/login')}
        />

        <RoleCard
          emoji="🛡️"
          title="Staff Login"
          subtitle="Manage & resolve community reports"
          accentColor={C.orange}
          delay={360}
          onPress={() => router.push('/(auth)/staff-login')}
        />

        <Text style={S.footerNote}>🔒  Secure access · Your data is protected</Text>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.offWhite },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 72 : 52,
    paddingBottom: 64,
    paddingHorizontal: 28,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  curve: {
    position: 'absolute', bottom: -32, left: -20, right: -20, height: 64,
    backgroundColor: C.offWhite, borderTopLeftRadius: 44, borderTopRightRadius: 44,
  },
  logoWrap:    { alignItems: 'center', marginBottom: 20 },
  logoBubble:  { width: 90, height: 90, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  logoImg:     { width: 62, height: 62, borderRadius: 14 },
  brand:       { fontSize: 32, fontWeight: '900', color: C.white, letterSpacing: 0.5 },
  tagline:     { fontSize: 15, color: 'rgba(255,255,255,0.62)', textAlign: 'center', fontWeight: '500', lineHeight: 22 },
  body:        { flex: 1, paddingHorizontal: 20, paddingTop: 38 },
  chooseLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 16 },
  footerNote:  { marginTop: 10, textAlign: 'center', fontSize: 12, color: C.textMuted, fontWeight: '500' },
});