/**
 * CivicEye — Track Screen
 * File: app/(tabs)/track.tsx
 *
 * Citizen tracks all their submitted reports.
 * Shows real-time status updates, department comments, and a progress timeline.
 * Full transparency: citizens can see every status change and department update.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchReports, Report } from '../../services/api';

const C = {
  bg: '#F0F2F5', white: '#FFFFFF', navy: '#1A2E4A',
  blue: '#4BB8E8', blueDark: '#3A90C4', blueLight: '#E8F5FC',
  orange: '#F5A623', orangeLight: '#FFF4E0',
  green: '#27AE60', greenLight: '#E8F8EE',
  red: '#E53935', redLight: '#FFEBEE',
  border: '#E2E8F0', textMuted: '#6B7A96',
};

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'resolved'] as const;

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string; step: number }> = {
  pending:     { bg: C.orangeLight, text: C.orange,   label: 'Pending',     icon: '⏳', step: 1 },
  in_progress: { bg: C.blueLight,   text: C.blueDark, label: 'In Progress', icon: '🔧', step: 2 },
  resolved:    { bg: C.greenLight,   text: C.green,    label: 'Resolved',    icon: '✅', step: 3 },
};

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: C.blueLight, text: C.blueDark, label: status, icon: '📋', step: 0 };
  return (
    <View style={[SB.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[SB.text, { color: cfg.text }]}>{cfg.icon} {cfg.label}</Text>
    </View>
  );
}
const SB = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  text:  { fontSize: 12, fontWeight: '700' },
});

// ── Progress Timeline ─────────────────────────────────────────────────────────
function ProgressTimeline({ status }: { status: string }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 1;
  const steps = [
    { label: 'Submitted', icon: '📝', step: 0 },
    { label: 'Pending',   icon: '⏳', step: 1 },
    { label: 'In Progress', icon: '🔧', step: 2 },
    { label: 'Resolved',  icon: '✅', step: 3 },
  ];

  return (
    <View style={PT.container}>
      {steps.map((s, i) => {
        const isDone = currentStep >= s.step;
        const isCurrent = currentStep === s.step;
        return (
          <View key={s.label} style={PT.stepWrap}>
            <View style={PT.dotRow}>
              {i > 0 && (
                <View style={[PT.line, isDone ? PT.lineActive : PT.lineInactive]} />
              )}
              <View style={[
                PT.dot,
                isDone && PT.dotActive,
                isCurrent && PT.dotCurrent,
              ]}>
                <Text style={{ fontSize: isCurrent ? 14 : 10 }}>{isDone ? s.icon : '○'}</Text>
              </View>
            </View>
            <Text style={[PT.label, isDone && PT.labelActive, isCurrent && PT.labelCurrent]}>
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
const PT = StyleSheet.create({
  container:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4 },
  stepWrap:     { alignItems: 'center', flex: 1 },
  dotRow:       { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', position: 'relative' },
  line:         { position: 'absolute', left: -20, right: '50%', height: 3, top: 13, zIndex: -1 },
  lineActive:   { backgroundColor: C.green },
  lineInactive: { backgroundColor: C.border },
  dot:          { width: 30, height: 30, borderRadius: 15, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dotActive:    { backgroundColor: C.greenLight },
  dotCurrent:   { backgroundColor: C.green + '30', borderWidth: 2, borderColor: C.green, width: 34, height: 34, borderRadius: 17 },
  label:        { fontSize: 9, color: C.textMuted, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  labelActive:  { color: C.green },
  labelCurrent: { fontWeight: '800', color: C.navy },
});

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ item, onPress }: { item: Report; onPress: () => void }) {
  const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const hasUpdates = item.comments.length > 0;
  const lastUpdate = hasUpdates ? item.comments[item.comments.length - 1] : null;

  return (
    <TouchableOpacity style={RC.card} onPress={onPress} activeOpacity={0.88}>
      {/* Image */}
      {item.image && <Image source={{ uri: item.image }} style={RC.img} resizeMode="cover" />}
      {!item.image && <View style={RC.imgPlaceholder}><Text style={{ fontSize: 28 }}>📋</Text></View>}

      <View style={RC.body}>
        {/* Title Row */}
        <View style={RC.topRow}>
          <Text style={RC.title} numberOfLines={1}>{item.title}</Text>
          {item.is_sos && <View style={RC.sosBadge}><Text style={RC.sosText}>🆘 SOS</Text></View>}
        </View>

        {/* Meta */}
        <View style={RC.metaRow}>
          <Text style={RC.meta}>📍 {item.location}</Text>
          <Text style={RC.meta}>{date}</Text>
        </View>

        {/* Department */}
        {item.department && (
          <View style={RC.deptRow}>
            <Ionicons name="business-outline" size={13} color={C.blueDark} />
            <Text style={RC.dept}>{item.department.name}</Text>
          </View>
        )}

        {/* Status + AI */}
        <View style={RC.footer}>
          <StatusBadge status={item.status} />
          {item.ai_detected && <Text style={RC.aiTag}>🤖 AI</Text>}
        </View>

        {/* Last Update Preview */}
        {lastUpdate && (
          <View style={RC.updatePreview}>
            <View style={RC.updateDot} />
            <View style={{ flex: 1 }}>
              <Text style={RC.updateLabel}>Latest update from department:</Text>
              <Text style={RC.updateText} numberOfLines={2}>{lastUpdate.text}</Text>
              <Text style={RC.updateTime}>{new Date(lastUpdate.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        )}

        {/* Comments count */}
        {hasUpdates && (
          <View style={RC.commentsRow}>
            <Ionicons name="chatbubbles-outline" size={14} color={C.blueDark} />
            <Text style={RC.comments}>{item.comments.length} department update{item.comments.length > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
const RC = StyleSheet.create({
  card:          { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 14, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  img:           { width: '100%', height: 140 },
  imgPlaceholder:{ width: '100%', height: 70, backgroundColor: C.blueLight, alignItems: 'center', justifyContent: 'center' },
  body:          { padding: 14 },
  topRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title:         { fontSize: 15, fontWeight: '700', color: C.navy, flex: 1, marginRight: 8 },
  sosBadge:      { backgroundColor: C.redLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  sosText:       { color: C.red, fontSize: 10, fontWeight: '900' },
  metaRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meta:          { fontSize: 11, color: C.textMuted },
  deptRow:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  dept:          { fontSize: 12, color: C.blueDark, fontWeight: '600' },
  aiTag:         { fontSize: 11, color: C.blueDark, fontWeight: '600' },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  updatePreview: {
    flexDirection: 'row', gap: 10, marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  updateDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue, marginTop: 4 },
  updateLabel:   { fontSize: 10, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  updateText:    { fontSize: 12, color: C.navy, lineHeight: 18 },
  updateTime:    { fontSize: 10, color: C.textMuted, marginTop: 3 },
  commentsRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  comments:      { fontSize: 12, color: C.blueDark, fontWeight: '600' },
});

// ── Detail View ───────────────────────────────────────────────────────────────
function ReportDetail({ report, onClose }: { report: Report; onClose: () => void }) {
  const lastUpdated = report.updated_at
    ? new Date(report.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <View style={D.root}>
      <StatusBar barStyle="light-content" />
      <View style={D.header}>
        <TouchableOpacity onPress={onClose} style={D.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.blue} />
          <Text style={D.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={D.headerTitle} numberOfLines={1}>{report.title}</Text>
      </View>
      <ScrollView contentContainerStyle={D.content} showsVerticalScrollIndicator={false}>
        {report.image && <Image source={{ uri: report.image }} style={D.img} resizeMode="cover" />}

        {/* Status + Progress Timeline */}
        <View style={D.card}>
          <Text style={D.sectionTitle}>📊 Report Status</Text>
          <View style={D.statusRow}>
            <StatusBadge status={report.status} />
            {lastUpdated && <Text style={D.lastUpdated}>Updated: {lastUpdated}</Text>}
          </View>
          <ProgressTimeline status={report.status} />
        </View>

        {/* Info */}
        <View style={D.card}>
          <Text style={D.sectionTitle}>📋 Report Details</Text>
          {report.department && (
            <>
              <Text style={D.label}>Assigned Department</Text>
              <View style={D.deptChip}>
                <Ionicons name="business" size={14} color={C.blueDark} />
                <Text style={D.deptText}>{report.department.name}</Text>
              </View>
            </>
          )}
          <Text style={[D.label, { marginTop: 14 }]}>Location</Text>
          <Text style={D.value}>📍 {report.location}</Text>
          <Text style={[D.label, { marginTop: 14 }]}>Category</Text>
          <Text style={D.value}>{report.category}</Text>
          {report.description ? (<><Text style={[D.label, { marginTop: 14 }]}>Description</Text><Text style={D.value}>{report.description}</Text></>) : null}
          {report.ai_detected && (<View style={D.aiRow}><Text style={D.aiText}>🤖 Category auto-detected by AI</Text></View>)}
          {report.is_sos && (<View style={D.sosBanner}><Text style={D.sosText}>🆘 SOS Emergency Report</Text></View>)}
        </View>

        {/* Transparency: Department Updates */}
        <View style={D.card}>
          <View style={D.updateHeader}>
            <Text style={D.sectionTitle}>🏢 Department Updates</Text>
            {report.comments.length > 0 && (
              <View style={D.updateCountBadge}>
                <Text style={D.updateCountText}>{report.comments.length}</Text>
              </View>
            )}
          </View>

          {report.comments.length === 0 ? (
            <View style={D.noUpdates}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>💬</Text>
              <Text style={D.noUpdatesTitle}>No updates yet</Text>
              <Text style={D.noUpdatesText}>
                The department will post updates here as they work on your report. Check back later!
              </Text>
            </View>
          ) : (
            <>
              <Text style={D.transparencyNote}>
                All updates from the department are shown here for full transparency.
              </Text>
              {report.comments.map((c, idx) => (
                <View key={c.id} style={D.comment}>
                  <View style={D.commentHeader}>
                    <View style={D.commentDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={D.commentAuthor}>🏢 {c.author_email}</Text>
                      <Text style={D.commentDate}>
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    {idx === report.comments.length - 1 && (
                      <View style={D.latestBadge}>
                        <Text style={D.latestText}>Latest</Text>
                      </View>
                    )}
                  </View>
                  <Text style={D.commentText}>{c.text}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
const D = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.navy, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingRight: 8 },
  backText:     { color: C.blue, fontSize: 15, fontWeight: '700' },
  headerTitle:  { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFF' },
  content:      { padding: 16, paddingBottom: 40 },
  img:          { width: '100%', height: 200, borderRadius: 14, marginBottom: 14 },
  card:         { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  statusRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  lastUpdated:  { fontSize: 10, color: C.textMuted },
  label:        { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  value:        { fontSize: 14, color: C.navy },
  deptChip:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.blueLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  deptText:     { fontSize: 13, fontWeight: '700', color: C.blueDark },
  aiRow:        { marginTop: 12, backgroundColor: C.blueLight, borderRadius: 10, padding: 10 },
  aiText:       { fontSize: 12, color: C.blueDark, fontWeight: '600' },
  sosBanner:    { marginTop: 10, backgroundColor: C.redLight, borderRadius: 10, padding: 10 },
  sosText:      { color: C.red, fontWeight: '800', fontSize: 13, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.navy, marginBottom: 12 },

  updateHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  updateCountBadge:{ backgroundColor: C.blue, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  updateCountText: { color: C.white, fontSize: 12, fontWeight: '800' },

  transparencyNote: { fontSize: 11, color: C.textMuted, fontStyle: 'italic', marginBottom: 14, backgroundColor: C.blueLight, borderRadius: 8, padding: 8 },

  noUpdates:      { alignItems: 'center', paddingVertical: 20 },
  noUpdatesTitle: { fontSize: 14, fontWeight: '700', color: C.navy, marginBottom: 4 },
  noUpdatesText:  { fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

  comment:       { borderLeftWidth: 3, borderLeftColor: C.blue, paddingLeft: 14, marginBottom: 16, backgroundColor: C.bg, borderRadius: 10, padding: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  commentDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue, marginTop: 5 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: C.blueDark },
  commentDate:   { fontSize: 10, color: C.textMuted, marginTop: 1 },
  commentText:   { fontSize: 13, color: C.navy, lineHeight: 20, paddingLeft: 16 },
  latestBadge:   { backgroundColor: C.green + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  latestText:    { fontSize: 9, fontWeight: '800', color: C.green, textTransform: 'uppercase' },
});

// ── Main Screen ─────────────────────────────────────────────────────────────────
export default function TrackScreen() {
  const [reports,    setReports]    = useState<Report[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<string>('all');
  const [selected,   setSelected]   = useState<Report | null>(null);
  const [error,      setError]      = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (e: any) { setError(e.message); }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  // Count by status
  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  if (selected) return <ReportDetail report={selected} onClose={() => { setSelected(null); load(); }} />;

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      <View style={S.header}>
        <Text style={S.title}>📍 Track My Reports</Text>
        <Text style={S.sub}>{reports.length} total · Pull to refresh for latest updates</Text>
      </View>

      {/* Transparency Notice */}
      <View style={S.transparencyBanner}>
        <Ionicons name="eye-outline" size={16} color={C.blueDark} />
        <Text style={S.transparencyText}>
          Real-time status & department updates are shown here
        </Text>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity key={f} style={[S.filterBtn, filter === f && S.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[S.filterText, filter === f && S.filterTextActive]}>
              {f === 'all' ? `All (${counts.all})`
                : f === 'pending' ? `Pending (${counts.pending})`
                : f === 'in_progress' ? `In Progress (${counts.in_progress})`
                : `Resolved (${counts.resolved})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={S.center}><ActivityIndicator size="large" color={C.blue} /></View>
      ) : error ? (
        <View style={S.center}>
          <Text style={{ color: C.red, marginBottom: 12 }}>⚠ {error}</Text>
          <TouchableOpacity onPress={load}><Text style={{ color: C.blue, fontWeight: '700' }}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={S.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={S.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
              <Text style={S.emptyTitle}>No reports found</Text>
              <Text style={S.emptySub}>Reports you submit will appear here with live status tracking.</Text>
            </View>
          ) : (
            filtered.map(r => <ReportCard key={r.id} item={r} onPress={() => setSelected(r)} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.white, paddingHorizontal: 18, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, elevation: 3 },
  title:  { fontSize: 20, fontWeight: '800', color: C.navy },
  sub:    { fontSize: 12, color: C.textMuted, marginTop: 2 },

  transparencyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.blueLight, marginHorizontal: 16, marginTop: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: C.blue + '30',
  },
  transparencyText: { fontSize: 12, color: C.blueDark, fontWeight: '600', flex: 1 },

  filterBar: { maxHeight: 54, paddingVertical: 10, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  filterBtnActive: { borderColor: C.navy, backgroundColor: C.navy },
  filterText:      { fontSize: 12, fontWeight: '600', color: C.textMuted },
  filterTextActive:{ color: C.white },
  content: { padding: 16 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:   { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', color: C.navy, marginBottom: 6 },
  emptySub:  { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
});