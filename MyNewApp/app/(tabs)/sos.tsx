/**
 * CivicEye — SOS Screen
 * File: app/(tabs)/sos.tsx
 * Emergency report sent to ALL departments simultaneously
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { submitSOS } from '../../services/api';

const C = {
  bg: '#FFF5F5', white: '#FFFFFF', navy: '#1A2E4A',
  red: '#E53935', redDark: '#C62828', redLight: '#FFEBEE',
  blue: '#4BB8E8', border: '#E2E8F0', textMuted: '#6B7A96',
};

export default function SOSScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [location,    setLocation]    = useState('');
  const [coords,      setCoords]      = useState<{ lat: number; lng: number } | null>(null);
  const [locating,    setLocating]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [sent,        setSent]        = useState(false);

  useEffect(() => {
    (async () => {
      setLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (geo[0]) {
            const g = geo[0];
            setLocation([g.street, g.district, g.city].filter(Boolean).join(', '));
          }
        }
      } catch { } finally { setLocating(false); }
    })();
  }, []);

  const handleSOS = async () => {
    Alert.alert(
      '🆘 Confirm SOS',
      'This will send an emergency alert to ALL departments immediately. Use only in genuine emergencies.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send SOS', style: 'destructive', onPress: doSend },
      ],
    );
  };

  const doSend = async () => {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title',       'SOS EMERGENCY');
      form.append('description', description.trim() || 'Emergency — immediate assistance needed');
      form.append('location',    location.trim() || 'Unknown');
      if (coords) { form.append('latitude', String(coords.lat)); form.append('longitude', String(coords.lng)); }
      await submitSOS(form);
      setSent(true);
    } catch (e: any) {
      Alert.alert('Failed to send SOS', e.message || 'Please try again or call emergency services directly.');
    } finally { setSubmitting(false); }
  };

  if (sent) {
    return (
      <View style={[S.root, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <View style={S.sentCircle}><Text style={{ fontSize: 48 }}>🆘</Text></View>
        <Text style={S.sentTitle}>SOS Sent!</Text>
        <Text style={S.sentSub}>Your emergency has been sent to all departments. Help is on the way. Stay in a safe location.</Text>
        <TouchableOpacity style={S.doneBtn} onPress={() => { setSent(false); router.replace('/(tabs)/dashboard' as any); }}>
          <Text style={S.doneBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" />
      <View style={S.header}>
        <Text style={S.headerTitle}>🆘 SOS Emergency</Text>
        <Text style={S.headerSub}>Sends alert to ALL departments simultaneously</Text>
      </View>

      <ScrollView contentContainerStyle={S.content} keyboardShouldPersistTaps="always">

        {/* Warning box */}
        <View style={S.warningBox}>
          <Text style={S.warningIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={S.warningTitle}>Emergency Use Only</Text>
            <Text style={S.warningSub}>Only use SOS for genuine emergencies. False alarms may result in account suspension.</Text>
          </View>
        </View>

        {/* Location */}
        <View style={S.card}>
          <Text style={S.cardTitle}>📍 Your Location</Text>
          {locating
            ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><ActivityIndicator size="small" color={C.red} /><Text style={{ color: C.textMuted }}>Detecting your location…</Text></View>
            : <TextInput style={S.input} value={location} onChangeText={setLocation} placeholder="Your current location" placeholderTextColor={C.textMuted} />
          }
          {coords && <Text style={S.coordText}>GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Text>}
        </View>

        {/* Description */}
        <View style={S.card}>
          <Text style={S.cardTitle}>📝 What's the emergency? (optional)</Text>
          <TextInput
            style={[S.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the emergency briefly…"
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={400}
          />
        </View>

        {/* SOS Button */}
        <TouchableOpacity style={[S.sosBtn, submitting && { opacity: 0.6 }]} onPress={handleSOS} disabled={submitting} activeOpacity={0.85}>
          {submitting
            ? <ActivityIndicator color={C.white} size="large" />
            : <><Text style={S.sosBtnIcon}>🆘</Text><Text style={S.sosBtnText}>SEND SOS</Text><Text style={S.sosBtnSub}>All departments will be alerted</Text></>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { backgroundColor: C.white, paddingHorizontal: 18, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 3 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.redDark },
  headerSub:   { fontSize: 12, color: C.textMuted, marginTop: 2 },
  content:     { padding: 16 },

  warningBox:   { flexDirection: 'row', gap: 12, backgroundColor: C.redLight, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.red + '44' },
  warningIcon:  { fontSize: 22 },
  warningTitle: { fontSize: 13, fontWeight: '700', color: C.redDark, marginBottom: 3 },
  warningSub:   { fontSize: 12, color: C.textMuted, lineHeight: 17 },

  card:      { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.navy, marginBottom: 10 },
  input:     { backgroundColor: '#F8F8F8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.navy, borderWidth: 1.5, borderColor: C.border },
  coordText: { fontSize: 11, color: C.textMuted, marginTop: 6 },

  sosBtn:      { backgroundColor: C.red, borderRadius: 20, paddingVertical: 24, alignItems: 'center', marginTop: 8, elevation: 8, shadowColor: C.red, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14 },
  sosBtnIcon:  { fontSize: 40, marginBottom: 6 },
  sosBtnText:  { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: 2 },
  sosBtnSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  sentCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: C.redLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  sentTitle:  { fontSize: 26, fontWeight: '800', color: C.redDark, marginBottom: 12 },
  sentSub:    { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneBtn:    { backgroundColor: C.navy, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  doneBtnText:{ color: C.white, fontSize: 15, fontWeight: '800' },
});