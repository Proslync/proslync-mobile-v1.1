import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassBorder, glassText, glassSurfaceTint } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAuth } from '@/lib/providers/auth-provider';
import { UserRole } from '@/lib/types/auth.types';
import { apiClient } from '@/lib/api/client';

// ── Types ──

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  description: string;
  private: boolean;
  default_branch: string;
  updated_at: string;
  language: string;
  html_url: string;
}

interface SelectedReposResponse {
  selectedRepos: GitHubRepo[];
  githubConnected: boolean;
  githubUser: string;
}

// ── Helpers ──

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function langColor(lang: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178C6',
    JavaScript: '#F7DF1E',
    Python: '#3776AB',
    Go: '#00ADD8',
    Rust: '#DEA584',
    Swift: '#F05138',
    Kotlin: '#7F52FF',
    Java: '#B07219',
    CSS: '#563D7C',
    HTML: '#E34C26',
  };
  return colors[lang] || '#8B8B8B';
}

// ── Main Screen ──

export default function EngineeringScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { user } = useAuth();
  const { isDark } = useAppTheme();

  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];

  const [repos, setRepos] = React.useState<GitHubRepo[]>([]);
  const [githubUser, setGithubUser] = React.useState('');
  const [githubConnected, setGithubConnected] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const data = await apiClient.get<SelectedReposResponse>('/api/superman/github/repos/selected');
      setRepos(data.selectedRepos || []);
      setGithubConnected(data.githubConnected);
      setGithubUser(data.githubUser || '');
    } catch (e) {
      console.warn('[Engineering] Failed to fetch repos:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Admin guard
  if (user?.role !== UserRole.ADMIN) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <DarkGradientBg />
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color="rgba(255,255,255,0.15)" />
          <Text style={styles.emptyText}>Admin access required</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="arrow-back" size={20} color={t.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.primary }]}>Engineering</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={t.primary} />
          </View>
        ) : (
          <>
            {/* GitHub Connection Status */}
            <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: t.muted }]}>GITHUB</Text>
              <View style={[styles.card, { borderColor: border }]}>
                <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={StyleSheet.absoluteFill} />
                <View style={styles.statusRow}>
                  <View style={styles.statusLeft}>
                    <Ionicons name="logo-github" size={22} color={t.primary} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.statusLabel, { color: t.primary }]}>
                        {githubConnected ? githubUser : 'Not connected'}
                      </Text>
                      <Text style={[styles.statusSub, { color: t.muted }]}>
                        {githubConnected ? `${repos.length} repos monitored` : 'Connect GitHub in dashboard settings'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: githubConnected ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)' }]}>
                    <View style={[styles.statusDot, { backgroundColor: githubConnected ? '#22C55E' : 'rgba(255,255,255,0.3)' }]} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: githubConnected ? '#22C55E' : t.muted }}>
                      {githubConnected ? 'Connected' : 'Offline'}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Monitored Repos */}
            {repos.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: t.muted }]}>MONITORED REPOS</Text>
                <View style={[styles.card, { borderColor: border }]}>
                  <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={StyleSheet.absoluteFill} />
                  {repos.map((repo, i) => (
                    <React.Fragment key={repo.id}>
                      <TouchableOpacity
                        style={styles.repoRow}
                        activeOpacity={0.7}
                        onPress={() => Linking.openURL(repo.html_url)}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.repoNameRow}>
                            <Ionicons
                              name={repo.private ? 'lock-closed' : 'globe-outline'}
                              size={13}
                              color={t.muted}
                              style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.repoName, { color: t.primary }]} numberOfLines={1}>
                              {repo.name}
                            </Text>
                          </View>
                          {repo.description ? (
                            <Text style={[styles.repoDesc, { color: t.muted }]} numberOfLines={1}>
                              {repo.description}
                            </Text>
                          ) : null}
                          <View style={styles.repoMeta}>
                            {repo.language ? (
                              <View style={styles.langBadge}>
                                <View style={[styles.langDot, { backgroundColor: langColor(repo.language) }]} />
                                <Text style={[styles.langText, { color: t.muted }]}>{repo.language}</Text>
                              </View>
                            ) : null}
                            <Text style={[styles.repoTime, { color: t.muted }]}>{timeAgo(repo.updated_at)}</Text>
                          </View>
                        </View>
                        <Ionicons name="open-outline" size={16} color={t.muted} />
                      </TouchableOpacity>
                      {i < repos.length - 1 && <View style={[styles.divider, { backgroundColor: border }]} />}
                    </React.Fragment>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Quick Links */}
            <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: t.muted }]}>QUICK LINKS</Text>
              <View style={[styles.card, { borderColor: border }]}>
                <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={StyleSheet.absoluteFill} />

                <TouchableOpacity
                  style={styles.linkRow}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('https://status.inc/dashboard')}
                >
                  <View style={[styles.linkIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                    <Ionicons name="desktop-outline" size={16} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.linkTitle, { color: t.primary }]}>Web Dashboard</Text>
                    <Text style={[styles.linkSub, { color: t.muted }]}>status.inc/dashboard</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={t.muted} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: border }]} />

                <TouchableOpacity
                  style={styles.linkRow}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('https://console.cloud.google.com/run?project=statussocial-prod-468715')}
                >
                  <View style={[styles.linkIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                    <Ionicons name="cloud-outline" size={16} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.linkTitle, { color: t.primary }]}>Cloud Run</Text>
                    <Text style={[styles.linkSub, { color: t.muted }]}>Production deployments</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={t.muted} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: border }]} />

                <TouchableOpacity
                  style={styles.linkRow}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(`https://github.com/${githubUser || 'statusdigitalinc'}`)}
                >
                  <View style={[styles.linkIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                    <Ionicons name="logo-github" size={16} color={t.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.linkTitle, { color: t.primary }]}>GitHub</Text>
                    <Text style={[styles.linkSub, { color: t.muted }]}>{githubUser || 'statusdigitalinc'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={t.muted} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Empty state if no repos */}
            {repos.length === 0 && githubConnected && (
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
                <View style={styles.centered}>
                  <Ionicons name="git-branch-outline" size={40} color="rgba(255,255,255,0.12)" />
                  <Text style={[styles.emptyText, { color: t.muted }]}>No repos selected</Text>
                  <Text style={[styles.emptySubtext, { color: t.muted }]}>Select repos to monitor in the web dashboard</Text>
                </View>
              </Animated.View>
            )}

            <View style={{ height: insets.bottom + 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  headerSpacer: { width: 36 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, fontFamily: 'Lato_700Bold' },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  statusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusLabel: { fontSize: 15, fontWeight: '600', fontFamily: 'Lato_700Bold' },
  statusSub: { fontSize: 12, marginTop: 2, fontFamily: 'Lato_400Regular' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  repoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  repoNameRow: { flexDirection: 'row', alignItems: 'center' },
  repoName: { fontSize: 14, fontWeight: '600', fontFamily: 'Lato_700Bold' },
  repoDesc: { fontSize: 12, marginTop: 3, fontFamily: 'Lato_400Regular' },
  repoMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  langBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  langDot: { width: 8, height: 8, borderRadius: 4 },
  langText: { fontSize: 11, fontFamily: 'Lato_400Regular' },
  repoTime: { fontSize: 11, fontFamily: 'Lato_400Regular' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  linkIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Lato_700Bold' },
  linkSub: { fontSize: 11, marginTop: 1, fontFamily: 'Lato_400Regular' },
  emptyText: { fontSize: 15, fontWeight: '600', marginTop: 12, fontFamily: 'Lato_700Bold' },
  emptySubtext: { fontSize: 13, marginTop: 4, fontFamily: 'Lato_400Regular', textAlign: 'center' },
});
