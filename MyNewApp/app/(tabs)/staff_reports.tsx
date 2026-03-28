/**
 * CivicEye — Staff Reports Tab
 * File: app/(tabs)/staff_reports.tsx
 *
 * Dedicated tab to view all reports reported by citizens for the staff's department.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Platform, RefreshControl,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Image,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  addComment, fetchReports,
  updateReportStatus, Report,
} from '../../services/api';

// ── Design Tokens (Matching Staff UI) ──────────────────────────────────
const C = {
  bg:            '#F0F4F8',          // Light grey background
  surface:       '#FFFFFF',          // White card
  surfaceAlt:    '#EAF2FB',          // Very light blue tint
  border:        '#C8DCF0',          // Soft blue border
  navy:          '#1A2E4A',          // Logo dark navy
  navyLight:     '#243C57',
  blue:          '#4BB8E8',          // Logo sky-blue
  blueDark:      '#2A8FC0',
  white:         '#FFFFFF',
  textPrimary:   '#1A2E4A',          // Navy for headings
  textSecondary: '#4A6880',
  textMuted:     '#8AACC8',
  error:         '#E05555',
  errorBg:       'rgba(224,85,85,0.08)',
  green:         '#27AE60',
  orange:        '#F5A623',
};

const DEPT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  electricity: { icon: 'bolt', label: 'Electricity', color: '#F5A623' },
  water:       { icon: 'tint', label: 'Water',       color: '#4BB8E8' },
  garbage:     { icon: 'trash', label: 'Garbage',     color: '#27AE60' },
  roads:       { icon: 'road', label: 'Roads',       color: '#E67E22' },
  fire:        { icon: 'fire', label: 'Fire',        color: '#E53935' },
  vandalism:   { icon: 'home', label: 'Vandalism',   color: '#9B59B6' },
  other:       { icon: 'building', label: 'General',     color: '#6B7A96' },
};

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending',     color: C.orange, icon: 'clock-o' as const },
  { value: 'in_progress', label: 'In Progress', color: C.blue,   icon: 'wrench' as const },
  { value: 'resolved',    label: 'Resolved',    color: C.green,  icon: 'check-circle' as const },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string; icon: string }> = {
    resolved:    { bg: C.green + '15',  text: C.green,    label: 'Resolved',    icon: 'check-circle' },
    pending:     { bg: C.orange + '15', text: C.orange,   label: 'Pending',     icon: 'clock-o' },
    in_progress: { bg: C.blue + '15',   text: C.blue,     label: 'In Progress', icon: 'wrench' },
  };
  const cfg = map[status] ?? { bg: C.blue + '15', text: C.blue, label: status, icon: 'info-circle' };
  return (
    <View style={[SB.badge, { backgroundColor: cfg.bg }]}>
      <FontAwesome name={cfg.icon as any} size={10} color={cfg.text} style={{ marginRight: 4 }} />
      <Text style={[SB.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}
const SB = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  text:  { fontSize: 11, fontWeight: '700' },
});

// ── Shared Report Modal ──────────────────────────────────────────────
function ReportModal({
  report, visible, onClose, onUpdated, deptColor,
}: {
  report: Report | null; visible: boolean;
  onClose: () => void; onUpdated: (r: Report) => void;
  deptColor: string;
}) {
  const [comment,   setComment]   = useState('');
  const [sending,   setSending]   = useState(false);
  const [updating,  setUpdating]  = useState(false);

  if (!report) return null;

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const updated = await updateReportStatus(report.id, newStatus);
      onUpdated(updated);
      Alert.alert('✓ Status Updated', `Report marked as ${newStatus.replace('_', ' ')}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setUpdating(false); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await addComment(report.id, comment.trim());
      setComment('');
      const updated = await fetchReports();
      const fresh = updated.find(r => r.id === report.id);
      if (fresh) onUpdated(fresh);
      Alert.alert('✓ Update Sent', 'Your update is now visible to the citizen.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSending(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={M.root}>
        <View style={M.header}>
          <TouchableOpacity onPress={onClose} style={M.closeBtn}>
            <Ionicons name="chevron-down" size={28} color={C.textSecondary} />
          </TouchableOpacity>
          <Text style={M.headerTitle} numberOfLines={1}>{report.title}</Text>
          {report.is_sos && (
            <View style={M.sosBadgeHeader}>
              <Text style={M.sosBadgeText}>SOS</Text>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={M.content} keyboardShouldPersistTaps="always">
          {report.image && <Image source={{ uri: report.image }} style={M.img} resizeMode="cover" />}

          <View style={M.card}>
            <Text style={M.sectionTitle}>Report Details</Text>
            <View style={M.infoRow}>
              <Text style={M.label}>Location</Text>
              <Text style={M.value}>📍 {report.location}</Text>
            </View>
            <View style={M.infoRow}>
              <Text style={M.label}>Category</Text>
              <Text style={M.value}>{report.category}</Text>
            </View>
            <View style={M.infoRow}>
              <Text style={M.label}>Submitted</Text>
              <Text style={M.value}>{new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {report.is_sos && <View style={M.sosBanner}><Text style={M.sosText}>🆘 SOS EMERGENCY REPORT</Text></View>}
            {report.description ? (
              <><Text style={[M.label, { marginTop: 12 }]}>Description</Text><Text style={M.value}>{report.description}</Text></>
            ) : null}
            {report.ai_detected && <Text style={M.aiTag}>🤖 Category auto-detected by AI</Text>}
          </View>

          <View style={M.card}>
            <Text style={M.sectionTitle}>Current Status</Text>
            <StatusBadge status={report.status} />
            <Text style={M.statusNote}>Citizens can see this status in real-time on their tracking page.</Text>
          </View>

          <View style={M.card}>
            <Text style={M.sectionTitle}>Update Status</Text>
            <Text style={M.statusHint}>Tap a status below to update. This change will be immediately visible to the citizen.</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {STATUS_OPTIONS.map(opt => {
                const isActive = report.status === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      M.statusBtn,
                      isActive && { backgroundColor: opt.color, borderColor: opt.color },
                      !isActive && { borderColor: C.border },
                    ]}
                    onPress={() => handleStatusChange(opt.value)}
                    disabled={updating || isActive}
                    activeOpacity={0.85}
                  >
                    {updating && !isActive
                      ? <ActivityIndicator size="small" color={opt.color} />
                      : <Text style={[M.statusBtnText, isActive && { color: C.white }, !isActive && { color: C.textSecondary }]}>{opt.label}</Text>
                    }
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={M.card}>
            <Text style={M.sectionTitle}>Send Update to Citizen</Text>
            <Text style={M.statusHint}>This message will appear in the citizen's tracking page.</Text>
            <TextInput
              style={[M.input, { height: 100, textAlignVertical: 'top', paddingTop: 12, marginTop: 12 }]}
              placeholder="Write an update for this report…"
              placeholderTextColor={C.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[M.commentBtn, { backgroundColor: C.blue }, (!comment.trim() || sending) && { opacity: 0.5 }]}
              onPress={handleComment}
              disabled={!comment.trim() || sending}
            >
              {sending ? <ActivityIndicator color={C.white} /> : <Text style={M.commentBtnText}>Send Update</Text>}
            </TouchableOpacity>
          </View>

          {report.comments.length > 0 && (
            <View style={M.card}>
              <Text style={M.sectionTitle}>Previous Updates ({report.comments.length})</Text>
              {report.comments.map(c => (
                <View key={c.id} style={[M.commentItem, { borderLeftColor: C.blue }]}>
                  <Text style={M.commentAuthor}>🏢 {c.author_email}</Text>
                  <Text style={M.commentText}>{c.text}</Text>
                  <Text style={M.commentDate}>{new Date(c.created_at).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const M = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 14, paddingHorizontal: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.textPrimary },
  sosBadgeHeader: { backgroundColor: C.error, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sosBadgeText:   { color: C.white, fontSize: 10, fontWeight: '900' },
  content: { padding: 16 },
  img:     { width: '100%', height: 220, borderRadius: 16, marginBottom: 16 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { marginBottom: 10 },
  label:   { fontSize: 11, fontWeight: '700', color: C.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  value:   { fontSize: 14, color: C.textPrimary, fontWeight: '500' },
  sosBanner: { backgroundColor: C.errorBg, borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: C.error + '20' },
  sosText:   { color: C.error, fontWeight: '800', fontSize: 13, textAlign: 'center' },
  aiTag:   { fontSize: 12, color: C.blue, marginTop: 8, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.textPrimary, marginBottom: 12 },
  statusNote:   { fontSize: 12, color: C.textSecondary, marginTop: 10, fontStyle: 'italic' },
  statusHint:   { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  statusBtn:     { flex: 1, minWidth: '30%', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', backgroundColor: C.bg },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  input:         { backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: C.textPrimary, borderWidth: 1.5, borderColor: C.border },
  commentBtn:    { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  commentBtnText:{ color: C.white, fontWeight: '800', fontSize: 15 },
  commentItem:   { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 16 },
  commentAuthor: { fontSize: 11, fontWeight: '700', color: C.blue, marginBottom: 4 },
  commentText:   { fontSize: 13, color: C.textPrimary, lineHeight: 20 },
  commentDate:   { fontSize: 10, color: C.textMuted, marginTop: 4 },
});


// ── Main Staff Reports Page ──────────────────────────────────────────────────
export default function StaffReportsScreen() {
  const { user, department } = useAuth();

  const [reports,    setReports]    = useState<Report[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('all');
  const [selected,   setSelected]   = useState<Report | null>(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const deptKey = (department || 'other').toLowerCase();
  const deptCfg = DEPT_CONFIG[deptKey] || DEPT_CONFIG.other;

  const load = useCallback(async () => {
    try {
      const r = await fetchReports({ department: department ?? undefined });
      setReports(r);
    } catch (e: any) { Alert.alert('Error', e.message); }
  }, [department]);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Filter logic
  let filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r => r.title.toLowerCase().includes(q) || r.location.toLowerCase().includes(q));
  }

  const deptName = department || user?.department || (user?.email?.split('@')[0] ?? 'Department');
  const displayDept = deptName.charAt(0).toUpperCase() + deptName.slice(1).replace('_', ' ');

  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={S.header}>
        <View style={S.headerTop}>
          <View style={S.logoContainer}>
            <FontAwesome name="folder-open" size={20} color={C.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.headerTitle}>All Department Reports</Text>
            <Text style={S.headerSub}>{displayDept}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={S.searchContainer}>
          <FontAwesome name="search" size={16} color={C.textMuted} style={S.searchIcon} />
          <TextInput
            style={S.searchInput}
            placeholder="Search by title or location..."
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={S.clearBtn}>
              <FontAwesome name="times-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={S.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {['all', 'pending', 'in_progress', 'resolved'].map(f => (
            <TouchableOpacity
              key={f}
              style={[S.filterBtn, filter === f && S.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[S.filterText, filter === f && S.filterTextActive]}>
                {f === 'all' ? `All (${counts.all})`
                  : f === 'pending' ? `Pending (${counts.pending})`
                  : f === 'in_progress' ? `Active (${counts.in_progress})`
                  : `Resolved (${counts.resolved})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.blue]} tintColor={C.blue} />}
        contentContainerStyle={{ padding: 16 }}
      >
        <Text style={S.resultsMeta}>Showing {filtered.length} reports</Text>

        {loading ? (
          <ActivityIndicator size="large" color={C.blue} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={S.empty}>
            <FontAwesome name="search" size={48} color={C.textMuted} />
            <Text style={S.emptyTitle}>No reports found</Text>
            <Text style={S.emptySub}>Try adjusting your filters or search query.</Text>
          </View>
        ) : (
          filtered.map(r => (
            <TouchableOpacity
              key={r.id}
              style={SR.card}
              onPress={() => { setSelected(r); setModalOpen(true); }}
              activeOpacity={0.85}
            >
              <View style={SR.cardContent}>
                {r.image ? (
                  <Image source={{ uri: r.image }} style={SR.thumb} resizeMode="cover" />
                ) : (
                  <View style={[SR.thumb, { backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <FontAwesome name="image" size={24} color={C.textMuted} />
                  </View>
                )}
                <View style={SR.info}>
                  <Text style={SR.title} numberOfLines={1}>{r.title}</Text>
                  <Text style={SR.meta}>{r.location}</Text>
                  <Text style={SR.meta}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  <Text style={SR.meta}>Reported by citizen</Text>
                </View>
              </View>
              <View style={[SR.statusStrip, { backgroundColor: r.status === 'resolved' ? C.green : r.status === 'pending' ? C.orange : C.blue }]} />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <ReportModal
        report={selected}
        visible={modalOpen}
        deptColor={deptCfg.color}
        onClose={() => setModalOpen(false)}
        onUpdated={updated => {
          setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
          setSelected(updated);
        }}
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.surface, paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  logoContainer: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.navy },
  headerSub:   { fontSize: 13, color: C.textSecondary, fontWeight: '600' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: C.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary, height: '100%' },
  clearBtn: { padding: 4 },

  filterContainer: { marginTop: 16, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 16 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.textMuted, backgroundColor: C.surface,
  },
  filterBtnActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterText:       { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  filterTextActive: { color: C.white },

  resultsMeta: { fontSize: 12, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },

  empty:      { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  emptySub:   { fontSize: 13, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
});

const SR = StyleSheet.create({
  card: {
    backgroundColor: C.surface, borderRadius: 16,
    marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardContent: { flexDirection: 'row', padding: 12, gap: 14 },
  thumb: { width: 90, height: 90, borderRadius: 12 },
  info:  { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: C.navy, marginBottom: 4 },
  meta:  { fontSize: 13, color: C.textSecondary, fontWeight: '600', marginBottom: 2 },
  statusStrip: { height: 4, width: '100%', opacity: 0.7 },
});
