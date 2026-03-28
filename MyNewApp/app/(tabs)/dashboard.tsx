/**
 * CivicEye — Dashboard Screen
 * File: app/(tabs)/dashboard.tsx
 *
 * Features:
 *  - Live stats from backend (resolved / pending / total)
 *  - SVG donut chart built from real data
 *  - Recent reports list with images & status badges
 *  - Pull-to-refresh
 *
 * NOTE: Bottom tab bar is now handled by Expo Router's built-in
 *       tab bar configured in app/(tabs)/_layout.tsx
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { fetchStats, fetchReports, Report, DashboardStats } from '../../services/api';

const { width } = Dimensions.get('window');

// ─── Design tokens (matching CivicEye logo) ───────────────────────────────────
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

// Types are now imported from services/api.ts

// Local fetching functions removed to use global services/api.ts

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────
function DonutChart({ resolved, pending, total }: { resolved: number; pending: number; total: number }) {
  const size   = 160;
  const radius = 58;
  const stroke = 22;

  const resolvedPct = total > 0 ? resolved / total : 0;
  const pendingPct  = total > 0 ? pending  / total : 0;

  const empty = total === 0;

  return (
    <View style={DC.wrap}>
      <View style={[DC.svgWrap, { width: size, height: size }]}>
        <View style={DC.bgRing} />

        {empty ? (
          <View style={DC.emptyRing} />
        ) : (
          <>
            <ArcSegment
              color={C.green}
              percentage={resolvedPct}
              rotation={0}
              size={size}
              radius={radius}
              strokeWidth={stroke}
            />
            <ArcSegment
              color={C.orange}
              percentage={pendingPct}
              rotation={resolvedPct * 360}
              size={size}
              radius={radius}
              strokeWidth={stroke}
            />
          </>
        )}

        <View style={DC.centerLabel}>
          <Text style={DC.centerNum}>{total}</Text>
          <Text style={DC.centerSub}>Total</Text>
        </View>
      </View>

      <View style={DC.legend}>
        <View style={DC.legendRow}>
          <View style={[DC.legendDot, { backgroundColor: C.green }]} />
          <Text style={DC.legendText}>Resolved</Text>
          <Text style={DC.legendVal}>{resolved}</Text>
        </View>
        <View style={[DC.legendRow, { marginTop: 8 }]}>
          <View style={[DC.legendDot, { backgroundColor: C.orange }]} />
          <Text style={DC.legendText}>Pending</Text>
          <Text style={DC.legendVal}>{pending}</Text>
        </View>
      </View>
    </View>
  );
}

function ArcSegment({
  color, percentage, rotation, size, radius, strokeWidth,
}: {
  color: string; percentage: number; rotation: number;
  size: number; radius: number; strokeWidth: number;
}) {
  const segments = Math.max(1, Math.round(percentage * 36));
  const segAngle = (percentage * 360) / segments;

  return (
    <>
      {Array.from({ length: segments }).map((_, i) => {
        const angle = rotation + i * segAngle;
        const rad   = (angle * Math.PI) / 180;
        const x     = size / 2 + radius * Math.cos(rad - Math.PI / 2);
        const y     = size / 2 + radius * Math.sin(rad - Math.PI / 2);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: strokeWidth,
              height: strokeWidth,
              borderRadius: strokeWidth / 2,
              backgroundColor: color,
              left: x - strokeWidth / 2,
              top:  y - strokeWidth / 2,
            }}
          />
        );
      })}
    </>
  );
}

const DC = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  svgWrap:     { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  bgRing:      { position: 'absolute', width: 138, height: 138, borderRadius: 69, borderWidth: 22, borderColor: '#E8ECF2' },
  emptyRing:   { position: 'absolute', width: 138, height: 138, borderRadius: 69, borderWidth: 22, borderColor: '#E8ECF2' },
  centerLabel: { alignItems: 'center' },
  centerNum:   { fontSize: 28, fontWeight: '800', color: C.navy },
  centerSub:   { fontSize: 11, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  legend:      { marginLeft: 24, flex: 1 },
  legendRow:   { flexDirection: 'row', alignItems: 'center' },
  legendDot:   { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText:  { flex: 1, fontSize: 13, color: C.textMuted, fontWeight: '500' },
  legendVal:   { fontSize: 15, fontWeight: '700', color: C.navy },
});

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = {
    resolved:    { bg: C.greenLight,  text: C.green,    label: 'Resolved' },
    pending:     { bg: C.orangeLight, text: C.orange,   label: 'Pending' },
    in_progress: { bg: C.blueLight,   text: C.blueDark, label: 'In Progress' },
  }[status] ?? { bg: C.blueLight, text: C.blueDark, label: status };

  return (
    <View style={[SB.badge, { backgroundColor: config.bg }]}>
      <Text style={[SB.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}
const SB = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  text:  { fontSize: 11, fontWeight: '700' },
});

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ item }: { item: Report }) {
  const date    = new Date(item.created_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={RC.card}>
      <View style={RC.imgWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={RC.img} resizeMode="cover" />
        ) : (
          <View style={RC.imgPlaceholder}>
            <Text style={RC.imgPlaceholderIcon}>📷</Text>
          </View>
        )}
      </View>

      <View style={RC.info}>
        <Text style={RC.title} numberOfLines={1}>{item.title}</Text>
        <View style={RC.locationRow}>
          <Text style={RC.locationIcon}>📍</Text>
          <Text style={RC.location} numberOfLines={1}>{item.location}</Text>
          <Text style={RC.date}>{dateStr}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
    </View>
  );
}
const RC = StyleSheet.create({
  card:               { flexDirection: 'row', backgroundColor: C.white, borderRadius: 14, marginBottom: 10, overflow: 'hidden', shadowColor: C.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  imgWrap:            { width: 90, height: 90 },
  img:                { width: '100%', height: '100%' },
  imgPlaceholder:     { width: '100%', height: '100%', backgroundColor: C.blueLight, alignItems: 'center', justifyContent: 'center' },
  imgPlaceholderIcon: { fontSize: 26 },
  info:               { flex: 1, padding: 12, justifyContent: 'space-between' },
  title:              { fontSize: 15, fontWeight: '700', color: C.navy, marginBottom: 4 },
  locationRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  locationIcon:       { fontSize: 11, marginRight: 3 },
  location:           { flex: 1, fontSize: 12, color: C.textMuted },
  date:               { fontSize: 12, color: C.textMuted, marginLeft: 4 },
});

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[SP.pill, { borderColor: color + '33', backgroundColor: color + '11' }]}>
      <Text style={[SP.val, { color }]}>{value}</Text>
      <Text style={[SP.label, { color }]}>{label}</Text>
    </View>
  );
}
const SP = StyleSheet.create({
  pill:  { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, marginHorizontal: 4 },
  val:   { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.8 },
});

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [stats,      setStats]      = useState<DashboardStats>({ total: 0, resolved: 0, pending: 0, in_progress: 0 });
  const [reports,    setReports]    = useState<Report[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [s, r] = await Promise.all([fetchStats(), fetchReports({ limit: 10 })]);
      setStats(s);
      setReports(r);
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard data.');
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const firstName = user?.email?.split('@')[0] ?? 'Citizen';

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── Header ── */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <Image
            source={require('../../assets/images/logoCiviceye.jpeg')}
            style={S.headerLogo}
            resizeMode="contain"
          />
          <Text style={S.headerBrand}>CivicEye</Text>
        </View>
        <TouchableOpacity
          style={S.avatarBtn}
          onPress={() => router.push('/(tabs)/profile' as any)}
          activeOpacity={0.8}
        >
          <Text style={S.avatarIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.blue}
            colors={[C.blue]}
          />
        }
      >
        {/* Greeting */}
        <Text style={S.greeting}>Good day, <Text style={S.greetingName}>{firstName}</Text> 👋</Text>
        <Text style={S.greetingSub}>Here's your civic activity overview</Text>

        {/* ── Report Issues CTA ── */}
        <TouchableOpacity
          style={S.reportCta}
          onPress={() => router.push('/(tabs)/report' as any)}
          activeOpacity={0.9}
        >
          <View style={S.reportCtaLeft}>
            <View style={S.reportCtaIconWrap}>
              <Text style={S.reportCtaIcon}>📸</Text>
            </View>
            <View>
              <Text style={S.reportCtaTitle}>Report an Issue</Text>
              <Text style={S.reportCtaSub}>Tap to submit a new report</Text>
            </View>
          </View>
          <Text style={S.reportCtaArrow}>›</Text>
        </TouchableOpacity>

        {/* ── Error state ── */}
        {!!error && (
          <View style={S.errorBox}>
            <Text style={S.errorText}>⚠  {error}</Text>
            <TouchableOpacity onPress={loadData} style={S.retryBtn}>
              <Text style={S.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={S.loadingWrap}>
            <ActivityIndicator size="large" color={C.blue} />
            <Text style={S.loadingText}>Loading your data…</Text>
          </View>
        ) : (
          <>
            {/* ── Stat pills ── */}
            <View style={S.statRow}>
              <StatPill label="Total"    value={stats.total}    color={C.navy}   />
              <StatPill label="Resolved" value={stats.resolved} color={C.green}  />
              <StatPill label="Pending"  value={stats.pending}  color={C.orange} />
            </View>

            {/* ── Chart card ── */}
            <View style={S.card}>
              <View style={S.cardHeader}>
                <View style={S.cardTitleRow}>
                  <View style={[S.cardDot, { backgroundColor: C.blue }]} />
                  <Text style={S.cardTitle}>Issues Overview</Text>
                </View>
              </View>
              <DonutChart
                resolved={stats.resolved}
                pending={stats.pending}
                total={stats.total}
              />
              <View style={S.totalBar}>
                <Text style={S.totalBarText}>Total Issues Reported: {stats.total}</Text>
              </View>
            </View>

            {/* ── Recent Reports ── */}
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>Your Recent Reports</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/track' as any)}>
                <Text style={S.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>

            {reports.length === 0 ? (
              <View style={S.emptyWrap}>
                <Text style={S.emptyIcon}>📋</Text>
                <Text style={S.emptyTitle}>No reports yet</Text>
                <Text style={S.emptyText}>Tap "Report an Issue" to submit your first civic report.</Text>
              </View>
            ) : (
              reports.map(r => <ReportCard key={r.id} item={r} />)
            )}
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo:  { width: 36, height: 36 },
  headerBrand: { fontSize: 20, fontWeight: '800', color: C.navy, letterSpacing: 0.2 },
  avatarBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blueLight, alignItems: 'center', justifyContent: 'center' },
  avatarIcon:  { fontSize: 18 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },

  greeting:     { fontSize: 22, fontWeight: '700', color: C.navy },
  greetingName: { color: C.blueDark },
  greetingSub:  { fontSize: 13, color: C.textMuted, marginTop: 3, marginBottom: 18 },

  // CTA
  reportCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.navy,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  reportCtaLeft:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reportCtaIconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  reportCtaIcon:     { fontSize: 22 },
  reportCtaTitle:    { fontSize: 16, fontWeight: '800', color: C.white },
  reportCtaSub:      { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  reportCtaArrow:    { fontSize: 28, color: C.blue, fontWeight: '300' },

  // Error
  errorBox:   { backgroundColor: '#FFEBEE', borderRadius: 12, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText:  { flex: 1, color: C.red, fontSize: 13, fontWeight: '500' },
  retryBtn:   { marginLeft: 12, backgroundColor: C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  retryText:  { color: C.white, fontSize: 12, fontWeight: '700' },

  // Loading
  loadingWrap: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, color: C.textMuted, fontSize: 14 },

  // Stat row
  statRow: { flexDirection: 'row', marginBottom: 14 },

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: C.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader:   { marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardDot:      { width: 8, height: 8, borderRadius: 4 },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: C.navy },

  totalBar: {
    marginTop: 16,
    backgroundColor: C.blueLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  totalBarText: { fontSize: 13, fontWeight: '700', color: C.blueDark },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: C.navy },
  sectionLink:   { fontSize: 13, color: C.blue, fontWeight: '600' },

  // Empty
  emptyWrap:  { alignItems: 'center', paddingVertical: 40, backgroundColor: C.white, borderRadius: 18, marginBottom: 16 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.navy, marginBottom: 6 },
  emptyText:  { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
});