/**
 * CivicEye — Report Screen (Final Refined V2)
 * File: app/(tabs)/report.tsx
 *
 * REFINEMENTS:
 * - Header: Matches Dashboard size and padding (Compact).
 * - Header Color: Lightened Navy gradient (NavyMid to NavyLight/Blue tint).
 * - Header Icon: Professional Camera icon.
 * - Photo Area: Camera icon instead of "+" sign.
 * - Issue Type: 2x3 Grid layout (2 columns, 3 rows).
 * - Styling: Strictly using the specified color palette and cardShadow.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image,
  KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location   from 'expo-location';
import { useRouter }   from 'expo-router';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { submitReport } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const C = {
  bg:           '#F0F2F5',
  white:        '#FFFFFF',
  navy:         '#1A2E4A',
  navyMid:      '#2C4A72',
  blue:         '#4BB8E8',
  blueDark:     '#3A90C4',
  blueLight:    '#E8F5FC',
  orange:       '#F5A623',
  orangeLight:  '#FFF4E0',
  green:        '#27AE60',
  greenLight:   '#E8F8EE',
  red:          '#E53935',
  redLight:     '#FFEBEE',
  border:       '#E2E8F0',
  textMuted:    '#6B7A96',
  text:         '#1A2E4A',
  cardShadow:   'rgba(26,46,74,0.08)',
};

const CATEGORIES = [
  { id: 'electricity', label: 'Electricity', icon: 'flash',        color: C.orange, bgColor: C.orangeLight, iconType: 'ion' },
  { id: 'water',       label: 'Water',       icon: 'water',        color: C.blue,   bgColor: C.blueLight,   iconType: 'ion' },
  { id: 'garbage',     label: 'Garbage',     icon: 'trash-outline', color: C.green,  bgColor: C.greenLight,  iconType: 'ion' },
  { id: 'roads',       label: 'Roads',       icon: 'road-variant', color: '#E67E22', bgColor: '#FFF4E0',     iconType: 'material' },
  { id: 'vandalism',   label: 'Vandalism',    icon: 'hammer-outline', color: '#9B59B6', bgColor: '#F5E8FF',     iconType: 'ion' },
  { id: 'other',       label: 'Other',       icon: 'help-circle-outline', color: C.textMuted, bgColor: '#F1F5F9', iconType: 'ion' },
];

export default function ReportScreen() {
  const router = useRouter();

  const [imageUri,   setImageUri]   = useState<string | null>(null);
  const [category,   setCategory]   = useState('');
  const [title,      setTitle]      = useState('');
  const [description,setDescription]= useState('');
  const [location,   setLocation]   = useState('');
  const [coords,     setCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [locating,   setLocating]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  useEffect(() => {
    (async () => {
      setLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (geo[0]) {
            const g = geo[0];
            setLocation([g.street, g.district, g.city].filter(Boolean).join(', '));
          }
        }
      } catch { /* silent */ } finally { setLocating(false); }
    })();
  }, []);

  const pickImage = useCallback(async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); return; }
      const r = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });
      if (!r.canceled) setImageUri(r.assets[0].uri);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery access required.'); return; }
      const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });
      if (!r.canceled) setImageUri(r.assets[0].uri);
    }
  }, []);

  const handlePhotoPress = () => {
    Alert.alert('Add Photo', 'Choose a source for the photo', [
      { text: 'Camera',        onPress: () => pickImage('camera') },
      { text: 'Photo Library', onPress: () => pickImage('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!imageUri) { Alert.alert('Photo required', 'Please add a photo of the issue.'); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      const fname = imageUri.split('/').pop() ?? 'photo.jpg';
      const ext   = fname.split('.').pop()?.toLowerCase() ?? 'jpg';
      form.append('image', { uri: imageUri, name: fname, type: ext === 'png' ? 'image/png' : 'image/jpeg' } as any);
      form.append('title',       title.trim()       || 'Civic Issue');
      form.append('description', description.trim() || '');
      form.append('location',    location.trim()    || 'Unknown');
      form.append('category',    category           || 'other');
      if (coords) { form.append('latitude', String(coords.lat)); form.append('longitude', String(coords.lng)); }
      await submitReport(form);
      setDone(true);
    } catch (e: any) {
      Alert.alert('Submission failed', e.message || 'Please try again.');
    } finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <View style={[S.root, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <View style={[S.successIconWrap, { backgroundColor: C.greenLight }]}>
          <Ionicons name="checkmark-circle" size={80} color={C.green} />
        </View>
        <Text style={S.successTitle}>Report Submitted!</Text>
        <Text style={S.successSub}>
          Thank you for your contribution. Our team will review your report and take action shortly.
        </Text>
        <TouchableOpacity style={S.doneBtn} onPress={() => { setDone(false); setImageUri(null); setTitle(''); setDescription(''); setCategory(''); router.replace('/(tabs)/dashboard' as any); }}>
          <Text style={S.doneBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Compact Lighter Navy Gradient Header (Matching Dashboard Size) */}
      <LinearGradient colors={[C.navyMid, C.blueDark]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={S.header}>
        <View style={S.headerTitleRow}>
          <Ionicons name="camera" size={22} color={C.white} style={{ marginRight: 10 }} />
          <Text style={S.headerTitle}>Report Issue</Text>
        </View>
        <Text style={S.headerSub}>Help us improve your city by reporting local issues.</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={S.content} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>

          {/* ── Photo Section ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <View style={[S.cardIconCircle, { backgroundColor: C.blueLight }]}>
                <Ionicons name="camera" size={18} color={C.blue} />
              </View>
              <Text style={S.cardTitle}>Issue Photo <Text style={S.required}>*</Text></Text>
            </View>
            {imageUri ? (
              <View style={S.previewContainer}>
                <Image source={{ uri: imageUri }} style={S.previewImg} resizeMode="cover" />
                <TouchableOpacity style={S.changeBtn} onPress={handlePhotoPress}>
                  <Ionicons name="refresh" size={16} color={C.white} style={{ marginRight: 6 }} />
                  <Text style={S.changeBtnText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={S.photoPlaceholder} onPress={handlePhotoPress} activeOpacity={0.8}>
                <View style={[S.photoIconCircle, { backgroundColor: C.blueLight }]}>
                  <Ionicons name="camera" size={40} color={C.blue} />
                </View>
                <Text style={S.photoPlaceholderText}>Tap to upload photo or take a photo</Text>
                <Text style={S.photoPlaceholderSub}>Camera or Gallery</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Category Selection (2x3 Grid) ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <View style={[S.cardIconCircle, { backgroundColor: C.orangeLight }]}>
                <Ionicons name="list" size={18} color={C.orange} />
              </View>
              <Text style={S.cardTitle}>Issue Type <Text style={S.optional}>(Optional)</Text></Text>
            </View>
            <View style={S.gridRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    S.gridItem, 
                    category === cat.id && { backgroundColor: cat.color, borderColor: cat.color }
                  ]}
                  onPress={() => setCategory(p => p === cat.id ? '' : cat.id)}
                  activeOpacity={0.8}
                >
                  {cat.iconType === 'material' ? (
                    <MaterialCommunityIcons name={cat.icon as any} size={20} color={category === cat.id ? C.white : cat.color} />
                  ) : (
                    <Ionicons name={cat.icon as any} size={20} color={category === cat.id ? C.white : cat.color} />
                  )}
                  <Text style={[S.gridText, category === cat.id && S.gridTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Details Section ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <View style={[S.cardIconCircle, { backgroundColor: C.bg }]}>
                <Ionicons name="create" size={18} color={C.navy} />
              </View>
              <Text style={S.cardTitle}>Issue Details</Text>
            </View>
            
            <Text style={S.inputLabel}>Title <Text style={S.optional}>(Optional)</Text></Text>
            <TextInput 
              style={S.input} 
              placeholder="e.g. Broken street light near school" 
              placeholderTextColor={C.textMuted} 
              value={title} 
              onChangeText={setTitle} 
              maxLength={120} 
            />

            <View style={{ height: 20 }} />

            <Text style={S.inputLabel}>Description <Text style={S.optional}>(Optional)</Text></Text>
            <TextInput 
              style={[S.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]} 
              placeholder="Describe the issue in more detail…" 
              placeholderTextColor={C.textMuted} 
              value={description} 
              onChangeText={setDescription} 
              multiline 
              maxLength={800} 
            />
            <Text style={S.charCount}>{description.length}/800</Text>
          </View>

          {/* ── Location Section ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <View style={[S.cardIconCircle, { backgroundColor: C.greenLight }]}>
                <Ionicons name="location" size={18} color={C.green} />
              </View>
              <Text style={S.cardTitle}>Location <Text style={S.optional}>(Auto-detected)</Text></Text>
              {locating && <ActivityIndicator size="small" color={C.green} style={{ marginLeft: 8 }} />}
            </View>
            <View style={S.locationBox}>
              <TextInput 
                style={[S.input, { borderBottomWidth: 0, marginBottom: 0, flex: 1 }]} 
                placeholder="Address / area name" 
                placeholderTextColor={C.textMuted} 
                value={location} 
                onChangeText={setLocation} 
                maxLength={200} 
              />
              {coords && !locating && (
                <View style={[S.gpsBadge, { backgroundColor: C.greenLight }]}>
                  <View style={[S.gpsDot, { backgroundColor: C.green }]} />
                  <Text style={[S.gpsBadgeText, { color: C.green }]}>GPS Active</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Submit Button ── */}
          <TouchableOpacity
            style={[S.submitBtn, (!imageUri || submitting) && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={!imageUri || submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={C.white} style={{ marginRight: 12 }} />
                <Text style={S.submitText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const S = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  { 
    paddingHorizontal: 18, 
    paddingTop: Platform.OS === 'ios' ? 56 : 36, 
    paddingBottom: 14, 
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.white },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 16 },
  
  content: { paddingHorizontal: 16, paddingTop: 16 },

  card: { 
    backgroundColor: C.white, 
    borderRadius: 18, 
    padding: 16, 
    marginBottom: 16, 
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardIconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cardTitle:  { fontSize: 16, fontWeight: '700', color: C.navy },
  required:   { color: C.red },
  optional:   { color: C.textMuted, fontWeight: '400', fontSize: 12 },

  photoPlaceholder: { 
    backgroundColor: C.blueLight, 
    borderRadius: 16, 
    height: 160, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.blue,
    borderStyle: 'dashed',
  },
  photoIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  photoPlaceholderText: { fontSize: 15, fontWeight: '700', color: C.blue, marginBottom: 4, textAlign: 'center', paddingHorizontal: 20 },
  photoPlaceholderSub:  { fontSize: 12, color: C.textMuted },

  previewContainer: { borderRadius: 16, overflow: 'hidden' },
  previewImg: { width: '100%', height: 220 },
  changeBtn: { 
    position: 'absolute', bottom: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 10, 
    borderRadius: 25, flexDirection: 'row', alignItems: 'center' 
  },
  changeBtnText: { color: C.white, fontSize: 13, fontWeight: '600' },

  gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  gridItem: { 
    width: '48%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingHorizontal: 12, 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: C.border,
    backgroundColor: C.white,
  },
  gridText: { fontSize: 13, fontWeight: '700', color: C.textMuted, flex: 1 },
  gridTextActive: { color: C.white },

  inputLabel: { fontSize: 14, fontWeight: '600', color: C.textMuted, marginBottom: 8 },
  input: { 
    fontSize: 15, color: C.navy, fontWeight: '500',
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: C.textMuted, marginTop: 6 },

  locationBox: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: C.bg, borderRadius: 12, 
    borderWidth: 1, borderColor: C.border,
    paddingRight: 12
  },
  gpsBadge: { 
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 
  },
  gpsDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  gpsBadgeText: { fontSize: 11, fontWeight: '700' },

  submitBtn: {
    backgroundColor: C.blue,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  submitText: { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: 0.5 },

  successIconWrap: { 
    width: 100, height: 100, borderRadius: 50, 
    alignItems: 'center', justifyContent: 'center', marginBottom: 24 
  },
  successTitle:  { fontSize: 30, fontWeight: '800', color: C.navy, marginBottom: 12 },
  successSub:    { fontSize: 16, color: C.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 40, paddingHorizontal: 20 },
  doneBtn:       { backgroundColor: C.navy, paddingHorizontal: 40, paddingVertical: 18, borderRadius: 16 },
  doneBtnText:   { color: C.white, fontSize: 16, fontWeight: '700' },
});