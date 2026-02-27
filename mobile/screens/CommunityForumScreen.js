import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
  Image,
} from 'react-native';
import { Text, Surface, ActivityIndicator, Portal, Dialog, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { ScanService } from '../services/ScanService';
import { CommunityService } from '../services/CommunityService';

const THEME = {
  primary: '#C71585',
  primaryDark: '#7A004F',
  primarySoft: '#F9E1F1',
  background: '#EEF2F7',
  surface: '#FFFFFF',
  textDark: '#1F2937',
  textMid: '#4B5563',
  textLight: '#6B7280',
  border: 'rgba(15, 23, 42, 0.08)',
  success: '#10B981',
  danger: '#B91C1C',
};

const DRAGON_TOPIC_REGEX = /\b(dragon\s*fruit|dragonfruit|pitaya|hylocereus|selenicereus|red\s*dragon|white\s*dragon|yellow\s*dragon)\b/i;
const NON_DRAGON_REGEX = /\b(no\s+dragon\s+fruit|not\s+(a\s+)?dragon\s*fruit|non[-\s]*dragon)\b/i;
const BAD_WORD_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|motherfucker|cunt)\b/ig,
  /\b(puta|putangina|putang\s*ina|gago|tanga|ulol|pakyu|bobo)\b/ig,
];

const maskBadLanguage = (text) => {
  let masked = String(text || '');
  BAD_WORD_PATTERNS.forEach((pattern) => {
    masked = masked.replace(pattern, (match) => '*'.repeat(match.length));
  });
  return masked;
};

const normalizeText = (value) => {
  const text = String(value || '').trim();
  return text.length ? text : undefined;
};

const formatArea = (ratio) => {
  const n = Number(ratio);
  if (!Number.isFinite(n) || n <= 0) return '0%';
  return `${Math.round(n * 100)}%`;
};

const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'PHP 0.00/kg';
  return `PHP ${n.toFixed(2)}/kg`;
};

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleString();
};

const getScanImageUri = (scan) => {
  const uri = String(
    scan?.imageUri ||
      scan?.imageUrl ||
      scan?.scanSnapshot?.imageUrl ||
      ''
  ).trim();
  return uri.length ? uri : null;
};

const isDragonFruitTopic = (text, scan) => {
  const cleanText = String(text || '');
  const scanText = `${scan?.fruit_type || scan?.fruitType || ''} ${scan?.notes || scan?.details || ''}`;
  const textHasDragon = DRAGON_TOPIC_REGEX.test(cleanText) && !NON_DRAGON_REGEX.test(cleanText);
  const scanHasDragon = DRAGON_TOPIC_REGEX.test(scanText) && !NON_DRAGON_REGEX.test(scanText);
  return Boolean(textHasDragon || scanHasDragon);
};

const getGradeTone = (grade) => {
  const value = String(grade || 'N/A').toUpperCase();
  if (value === 'A') return { bg: '#DCFCE7', text: '#166534' };
  if (value === 'B') return { bg: '#E0F2FE', text: '#075985' };
  if (value === 'C') return { bg: '#FEF3C7', text: '#92400E' };
  if (value === 'D' || value === 'E') return { bg: '#FEE2E2', text: '#991B1B' };
  return { bg: '#E5E7EB', text: '#374151' };
};

const UserAvatar = ({ url, name, size = 34 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(16,25,39,0.1)',
      overflow: 'hidden',
    }}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: size * 0.45 }}>
          {initial}
        </Text>
      )}
    </View>
  );
};

export default function CommunityForumScreen({ navigation, user }) {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [scans, setScans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [postText, setPostText] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [formError, setFormError] = useState('');
  const [feedError, setFeedError] = useState('');
  const [scanError, setScanError] = useState('');
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [reactorsVisible, setReactorsVisible] = useState(false);
  const [currentReactors, setCurrentReactors] = useState([]);
  const [reactionType, setReactionType] = useState('');

  const selectedScan = useMemo(
    () => scans.find((scan) => String(scan?.id) === String(selectedScanId)) || null,
    [scans, selectedScanId]
  );

  const loadNotifications = useCallback(async () => {
    try {
      const data = await CommunityService.getNotifications({ user, limit: 40 });
      setNotifications(Array.isArray(data?.items) ? data.items : []);
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);

    const [postsResult, scansResult, notifResult] = await Promise.allSettled([
      CommunityService.getPosts({ limit: 70 }),
      ScanService.getScans({ user }),
      CommunityService.getNotifications({ user, limit: 40 }),
    ]);

    if (postsResult.status === 'fulfilled') {
      setPosts(Array.isArray(postsResult.value) ? postsResult.value : []);
      setFeedError('');
    } else {
      setPosts([]);
      setFeedError(postsResult.reason?.message || 'Failed to load community posts.');
    }

    if (scansResult.status === 'fulfilled') {
      const safeScans = Array.isArray(scansResult.value) ? scansResult.value : [];
      setScans(safeScans);
      setScanError('');
      setSelectedScanId((prev) => {
        if (prev && safeScans.some((item) => String(item?.id) === String(prev))) return prev;
        return safeScans.length ? safeScans[0].id : null;
      });
    } else {
      setScans([]);
      setSelectedScanId(null);
      setScanError('Could not load your local scan list right now.');
    }

    if (notifResult.status === 'fulfilled') {
      setNotifications(Array.isArray(notifResult.value?.items) ? notifResult.value.items : []);
      setUnreadCount(Number(notifResult.value?.unreadCount || 0));
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
      const poll = setInterval(() => {
        void loadNotifications();
      }, 15000);
      return () => clearInterval(poll);
    }, [loadData, loadNotifications])
  );

  const handleOpenNotifications = async () => {
    setNotificationsVisible(true);
    if (unreadCount <= 0) return;
    try {
      await CommunityService.markNotificationsRead({ user });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n?.readAt || new Date().toISOString() })));
    } catch {}
  };

  const handlePost = async () => {
    if (posting) return;
    const cleanText = String(postText || '').trim();

    if (!cleanText && !selectedScan) {
      setFormError('Add text or attach a scan result before posting.');
      return;
    }

    const combinedText = `${cleanText} ${selectedScan?.notes || selectedScan?.details || ''}`.trim();

    if (!isDragonFruitTopic(cleanText, selectedScan)) {
      setFormError('Posts must focus on dragon fruit scan results.');
      return;
    }

    const maskedText = maskBadLanguage(cleanText);

    try {
      setPosting(true);
      setFormError('');
      const created = await CommunityService.createPost({
        user,
        text: maskedText,
        scan: selectedScan,
      });
      setPosts((prev) => [created, ...prev]);
      setPostText('');
      setFeedError('');
      void loadNotifications();
    } catch (error) {
      setFormError(error?.message || 'Could not create post.');
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (post, type) => {
    try {
      const updated = await CommunityService.toggleReaction({ user, postId: post._id || post.id, type });
      setPosts((prev) =>
        prev.map((p) => {
          const pid = String(p._id || p.id);
          const uid = String(updated._id || updated.id);
          return pid === uid ? updated : p;
        })
      );
    } catch (error) {
      console.warn('Failed to react:', error);
    }
  };

  const handleCommentSubmit = async (post) => {
    const postId = String(post?._id || post?.id || '');
    const text = String(commentDrafts[postId] || '').trim();
    if (!postId || !text) return;

    const maskedText = maskBadLanguage(text);

    try {
      setCommentingPostId(postId);
      setFeedError('');
      const updatedPost = await CommunityService.addComment({ user, postId, text: maskedText });
      setPosts((prev) =>
        prev.map((item) => {
          const id = String(item?._id || item?.id || '');
          return id === postId ? updatedPost : item;
        })
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      void loadNotifications();
    } catch (error) {
      setFeedError(error?.message || 'Could not add comment.');
    } finally {
      setCommentingPostId(null);
    }
  };

  const confirmDelete = (post) => {
    setDeleteTarget(post);
    setDeleteVisible(true);
  };

  const performDelete = async () => {
    try {
      const postId = String(deleteTarget?._id || deleteTarget?.id || '');
      if (!postId) {
        setDeleteVisible(false);
        setDeleteTarget(null);
        return;
      }
      await CommunityService.deletePost({ user, postId });
      setPosts((prev) => prev.filter((p) => String(p?._id || p?.id) !== postId));
      void loadData({ silent: true });
    } catch (err) {
      console.warn('[community] delete failed:', err?.message || err);
    } finally {
      setDeleteVisible(false);
      setDeleteTarget(null);
    }
  };

  const showReactors = (reactors, type) => {
    const filtered = reactors.filter((r) => r.type === type);
    if (!filtered || filtered.length === 0) return;
    setCurrentReactors(filtered);
    setReactionType(type);
    setReactorsVisible(true);
  };

  const renderPost = ({ item }) => {
    const scan = item?.scanSnapshot || null;
    const authorName = item?.authorName || item?.user?.name || 'Anonymous User';
    const authorEmail = item?.authorEmail || item?.user?.email || '';
    const postId = String(item?._id || item?.id || '');
    const comments = Array.isArray(item?.comments) ? item.comments : [];
    const postImageUri = getScanImageUri(scan);
    const gradeTone = getGradeTone(scan?.grade);

    const reactions = Array.isArray(item?.reactions) ? item.reactions : [];
    const heartCount = reactions.filter((r) => r.type === 'heart').length;
    const likeCount = reactions.filter((r) => r.type === 'like').length;

    const userId = user?._id || user?.id || user?.userId;
    const userEmail = normalizeText(user?.email)?.toLowerCase();

    const myReaction = reactions.find((r) => {
      if (userId && r.user && String(r.user) === String(userId)) return true;
      if (userEmail && r.email === userEmail) return true;
      return false;
    });

    const isHearted = myReaction?.type === 'heart';
    const isLiked = myReaction?.type === 'like';
    const canDelete =
      (userId && item?.user && String(item.user?._id || item.user) === String(userId)) ||
      (userEmail && String(item?.authorEmail || '').toLowerCase() === String(userEmail));

    const confirmDeleteLocal = () => confirmDelete(item);

    return (
      <Surface style={styles.postCard} elevation={2}>
        <View style={styles.postHead}>
          <UserAvatar url={item?.user?.avatar} name={authorName} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.postAuthor}>{authorName}</Text>
            <Text style={styles.postMeta}>
              {formatDate(item?.createdAt || item?.timestamp)}
            </Text>
          </View>
          {canDelete ? (
            <TouchableOpacity onPress={confirmDeleteLocal} style={{ padding: 6 }} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={18} color={THEME.danger} />
            </TouchableOpacity>
          ) : null}
        </View>

        {item?.text ? <Text style={styles.postText}>{item.text}</Text> : null}

        {postImageUri ? (
          <Image source={{ uri: postImageUri }} style={styles.postImage} resizeMode="cover" />
        ) : null}

        {scan ? (
          <View style={styles.scanSnap}>
            <View style={styles.snapRow}>
              <View style={[styles.snapBadge, { backgroundColor: gradeTone.bg }]}>
                <Text style={[styles.snapBadgeText, { color: gradeTone.text }]}>Grade {scan.grade || 'N/A'}</Text>
              </View>
              <View style={styles.snapBadge}>
                <Text style={styles.snapBadgeText}>{formatArea(scan.fruitAreaRatio)} area</Text>
              </View>
              <View style={styles.snapBadge}>
                <Text style={styles.snapBadgeText}>{formatPrice(scan.estimatedPricePerKg)}</Text>
              </View>
            </View>
            <Text style={styles.snapFruit}>{scan.fruitType || 'Dragon fruit scan result'}</Text>
            <Text style={styles.snapNotes}>{scan.notes || 'No notes provided.'}</Text>
          </View>
        ) : null}

        <View style={styles.reactionRow}>
          <TouchableOpacity
            style={[styles.reactionBtn, isHearted && styles.reactionActive]}
            onPress={() => handleReaction(item, 'heart')}
            onLongPress={() => showReactors(reactions, 'heart')}
            activeOpacity={0.7}
          >
            <Ionicons name={isHearted ? 'heart' : 'heart-outline'} size={20} color={isHearted ? '#e11d48' : '#64748b'} />
            <Text style={[styles.reactionCount, isHearted && { color: '#e11d48' }]}>
              {heartCount > 0 ? heartCount : 'Heart'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reactionBtn, isLiked && styles.reactionActive]}
            onPress={() => handleReaction(item, 'like')}
            onLongPress={() => showReactors(reactions, 'like')}
            activeOpacity={0.7}
          >
            <Ionicons name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'} size={20} color={isLiked ? '#2563eb' : '#64748b'} />
            <Text style={[styles.reactionCount, isLiked && { color: '#2563eb' }]}>
              {likeCount > 0 ? likeCount : 'Like'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commentsWrap}>
          <Text style={styles.commentsLabel}>Comments ({comments.length})</Text>
          {comments.length ? (
            comments.slice(-3).map((comment) => (
              <View key={String(comment?._id || `${comment?.createdAt}-${comment?.text}`)} style={styles.commentItem}>
                <UserAvatar url={comment?.commenterUser?.avatar} name={comment?.commenterName} size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentAuthor}>
                    {comment?.commenterName || 'User'} <Text style={{ fontWeight: '400', fontSize: 10 }}>• {formatDate(comment?.createdAt)}</Text>
                  </Text>
                  <Text style={styles.commentText}>{comment?.text || ''}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.commentEmpty}>No comments yet.</Text>
          )}

          <View style={styles.commentComposer}>
            <TextInput
              value={commentDrafts[postId] || ''}
              onChangeText={(value) => setCommentDrafts((prev) => ({ ...prev, [postId]: value }))}
              placeholder="Write a comment..."
              placeholderTextColor="#9CA3AF"
              style={styles.commentInput}
            />
            <TouchableOpacity
              onPress={() => handleCommentSubmit(item)}
              style={[styles.commentSendBtn, commentingPostId === postId && { opacity: 0.72 }]}
              disabled={commentingPostId === postId}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
        <LinearGradient colors={[THEME.primaryDark, THEME.primary]} style={StyleSheet.absoluteFill} />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Community Forum</Text>
            <Text style={styles.headerSub}>Share dragon fruit scan findings with other growers</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleOpenNotifications} style={styles.headerBtn}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              {unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => loadData({ silent: true })} style={styles.headerBtn}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Portal>
        <Dialog visible={notificationsVisible} onDismiss={() => setNotificationsVisible(false)} style={styles.notifDialog}>
          <Dialog.Title style={styles.notifTitle}>Community Notifications</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 10 }}>
              {notifications.length ? (
                notifications.map((item) => (
                  <View key={String(item?._id || item?.id || `${item?.createdAt}-${item?.message}`)} style={[styles.notifItem, { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }]}>
                    <UserAvatar url={item?.actorUser?.avatar} name={item?.actorUser?.name || 'System'} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifMessage}>{item?.message || 'Community update'}</Text>
                      <Text style={styles.notifMeta}>{formatDate(item?.createdAt)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.notifEmpty}>No notifications yet.</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={THEME.textLight} onPress={() => setNotificationsVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={reactorsVisible} onDismiss={() => setReactorsVisible(false)} style={styles.notifDialog}>
          <Dialog.Title style={styles.notifTitle}>
            Reacted with {reactionType === 'heart' ? '❤️' : '👍'}
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 10 }}>
              {currentReactors.length ? (
                currentReactors.map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <UserAvatar url={r.user?.avatar} name={r.name} size={32} />
                    <Text style={{ color: THEME.textDark, fontWeight: '600' }}>{r.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.notifEmpty}>No reactions yet.</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={THEME.textLight} onPress={() => setReactorsVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)} style={{ backgroundColor: '#fff' }}>
          <Dialog.Title style={{ color: THEME.textDark }}>Delete this post?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: THEME.textLight }}>
              This will permanently remove the post from the community. This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={THEME.textLight} onPress={() => setDeleteVisible(false)}>Cancel</Button>
            <Button textColor={THEME.danger} onPress={performDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loaderText}>Loading community forum...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item, idx) => String(item?._id || item?.id || idx)}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData({ silent: true })} />}
          ListHeaderComponent={(
            <View style={styles.composeWrap}>
              <Surface style={styles.composeCard} elevation={2}>
                <View style={styles.composeHeadingRow}>
                  <Text style={styles.composeTitle}>Create Post</Text>
                  <Text style={styles.composeHint}>Dragon fruit updates only</Text>
                </View>
                <TextInput
                  value={postText}
                  onChangeText={setPostText}
                  placeholder="Share what you observed from your scan..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  style={styles.input}
                />

                <Text style={styles.scanPickLabel}>Attach a scan result</Text>
                <FlatList
                  horizontal
                  data={scans}
                  keyExtractor={(item) => String(item?.id)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingVertical: 6 }}
                  renderItem={({ item }) => {
                    const selected = String(item?.id) === String(selectedScanId);
                    const imageUri = getScanImageUri(item);
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedScanId(item?.id)}
                        style={[styles.scanChip, selected && styles.scanChipSelected]}
                        activeOpacity={0.9}
                      >
                        {imageUri ? (
                          <Image source={{ uri: imageUri }} style={styles.scanChipImage} />
                        ) : (
                          <View style={styles.scanChipNoImage}>
                            <Ionicons name="image-outline" size={16} color={THEME.textLight} />
                          </View>
                        )}
                        <Text style={[styles.scanChipTitle, selected && styles.scanChipTitleSelected]}>
                          {item?.fruit_type || 'Dragon fruit'} | Grade {item?.grade || 'N/A'}
                        </Text>
                        <Text style={[styles.scanChipMeta, selected && styles.scanChipMetaSelected]}>
                          {formatArea(item?.fruit_area_ratio)} | {formatPrice(item?.estimated_price_per_kg)}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={(
                    <Text style={styles.emptyScans}>
                      {scanError || 'No local scans yet. Scan first to attach results.'}
                    </Text>
                  )}
                />

                {selectedScan ? (
                  <View style={styles.selectedPreviewCard}>
                    <Text style={styles.selectedPreviewTitle}>Selected scan preview</Text>
                    {getScanImageUri(selectedScan) ? (
                      <Image source={{ uri: getScanImageUri(selectedScan) }} style={styles.selectedPreviewImage} />
                    ) : (
                      <View style={styles.selectedPreviewNoImage}>
                        <Ionicons name="camera-outline" size={20} color={THEME.textLight} />
                        <Text style={styles.selectedPreviewNoImageText}>No image preview</Text>
                      </View>
                    )}
                    <Text style={styles.selectedPreviewMeta}>
                      {selectedScan?.fruit_type || 'Dragon fruit'} | Grade {selectedScan?.grade || 'N/A'} | {formatArea(selectedScan?.fruit_area_ratio)}
                    </Text>
                  </View>
                ) : null}

                {!!formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                <TouchableOpacity
                  onPress={handlePost}
                  style={[styles.postBtn, posting && { opacity: 0.72 }]}
                  disabled={posting}
                  activeOpacity={0.9}
                >
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.postBtnText}>{posting ? 'Posting...' : 'Post to Community'}</Text>
                </TouchableOpacity>
              </Surface>

              <View style={styles.feedHeader}>
                <View>
                  <Text style={styles.feedTitle}>Latest Posts</Text>
                  <Text style={styles.feedSub}>Live updates from all users</Text>
                </View>
                <View style={styles.feedCountPill}>
                  <Text style={styles.feedCountPillText}>{posts.length}</Text>
                </View>
              </View>

              {!!feedError ? (
                <View style={styles.feedErrorWrap}>
                  <Ionicons name="warning-outline" size={14} color={THEME.danger} />
                  <Text style={styles.feedErrorText}>{feedError}</Text>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={(
            <Surface style={styles.emptyFeed} elevation={1}>
              <Text style={styles.emptyFeedTitle}>No posts yet</Text>
              <Text style={styles.emptyFeedSub}>Be the first to share your dragon fruit scan result.</Text>
            </Surface>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerWrap: {
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  headerRow: {
    paddingHorizontal: 14,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    position: 'relative',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12.5,
    marginTop: 2,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    color: THEME.textLight,
    fontWeight: '700',
  },
  listContent: {
    padding: 14,
    paddingBottom: 140,
    gap: 12,
  },
  composeWrap: {
    marginBottom: 8,
  },
  composeCard: {
    borderRadius: 18,
    backgroundColor: THEME.surface,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  composeHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  composeTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.textDark,
  },
  composeHint: {
    color: THEME.primaryDark,
    backgroundColor: THEME.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '800',
  },
  input: {
    minHeight: 88,
    maxHeight: 150,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    backgroundColor: '#fff',
    color: THEME.textDark,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    marginBottom: 10,
    fontSize: 14,
  },
  scanPickLabel: {
    color: THEME.textMid,
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  scanChip: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.11)',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 190,
  },
  scanChipImage: {
    width: '100%',
    height: 84,
    borderRadius: 10,
    backgroundColor: '#EEF1F4',
    marginBottom: 7,
  },
  scanChipNoImage: {
    width: '100%',
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  scanChipSelected: {
    borderColor: THEME.primary,
    backgroundColor: 'rgba(199, 21, 133, 0.08)',
  },
  scanChipTitle: {
    color: THEME.textDark,
    fontWeight: '800',
    fontSize: 12,
  },
  scanChipTitleSelected: {
    color: THEME.primaryDark,
  },
  scanChipMeta: {
    color: THEME.textLight,
    fontSize: 11,
    marginTop: 2,
  },
  scanChipMetaSelected: {
    color: THEME.primaryDark,
  },
  emptyScans: {
    color: THEME.textLight,
    fontSize: 12,
    paddingVertical: 8,
    fontWeight: '600',
  },
  selectedPreviewCard: {
    marginTop: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#fff',
    padding: 10,
  },
  selectedPreviewTitle: {
    color: THEME.textDark,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },
  selectedPreviewImage: {
    width: '100%',
    height: 184,
    borderRadius: 10,
    backgroundColor: '#EEF1F4',
  },
  selectedPreviewNoImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selectedPreviewNoImageText: {
    color: THEME.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  selectedPreviewMeta: {
    color: THEME.textLight,
    fontSize: 11,
    marginTop: 8,
  },
  errorText: {
    color: THEME.danger,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '700',
  },
  postBtn: {
    marginTop: 9,
    borderRadius: 13,
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  postBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  feedHeader: {
    marginTop: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.textDark,
  },
  feedSub: {
    color: THEME.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  feedCountPill: {
    minWidth: 36,
    height: 30,
    borderRadius: 16,
    backgroundColor: THEME.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(199, 21, 133, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  feedCountPillText: {
    color: THEME.primaryDark,
    fontWeight: '900',
    fontSize: 13,
  },
  feedErrorWrap: {
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  feedErrorText: {
    color: THEME.danger,
    fontSize: 12,
    flex: 1,
    fontWeight: '700',
  },
  postCard: {
    borderRadius: 16,
    backgroundColor: THEME.surface,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  postHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
  },
  postAuthor: {
    color: THEME.textDark,
    fontWeight: '800',
    fontSize: 13,
  },
  postMeta: {
    color: THEME.textLight,
    fontSize: 11,
    marginTop: 1,
  },
  postText: {
    color: THEME.textDark,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    fontWeight: '500',
  },
  postImage: {
    width: '100%',
    height: 184,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginTop: 10,
  },
  scanSnap: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 10,
  },
  snapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  snapBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  snapBadgeText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '800',
  },
  snapFruit: {
    color: THEME.textDark,
    fontWeight: '800',
    fontSize: 13,
  },
  snapNotes: {
    color: THEME.textLight,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
  commentsWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
    gap: 8,
  },
  commentsLabel: {
    color: THEME.textDark,
    fontSize: 12,
    fontWeight: '800',
  },
  commentItem: {
    borderRadius: 10,
    backgroundColor: 'rgba(15,23,42,0.04)',
    paddingHorizontal: 9,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  commentAuthor: {
    color: THEME.textDark,
    fontSize: 12,
    fontWeight: '700',
  },
  commentText: {
    color: THEME.textMid,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  commentEmpty: {
    color: THEME.textLight,
    fontSize: 12,
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: THEME.textDark,
  },
  commentSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  reactionActive: {
    backgroundColor: 'rgba(199, 21, 133, 0.08)',
    borderColor: 'rgba(199, 21, 133, 0.2)',
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  emptyFeed: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  emptyFeedTitle: {
    color: THEME.textDark,
    fontWeight: '900',
  },
  emptyFeedSub: {
    color: THEME.textLight,
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  notifDialog: {
    backgroundColor: '#fff',
  },
  notifTitle: {
    color: THEME.textDark,
    fontWeight: '900',
  },
  notifItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  notifMessage: {
    color: THEME.textDark,
    fontSize: 13,
    fontWeight: '700',
  },
  notifMeta: {
    color: THEME.textLight,
    fontSize: 11,
    marginTop: 3,
  },
  notifEmpty: {
    color: THEME.textLight,
    fontSize: 12,
  },
});
