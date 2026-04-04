import * as React from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  usePost,
  usePostComments,
  useAddComment,
  usePostReaction,
  useDeletePost,
  type CommentData,
} from '@/hooks';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint, glassBorder, glassText, glassSurfaceTint } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { LinkifiedText } from '@/components/shared/linkified-text';
import { FeedMediaPlayer } from '@/components/feed/feed-media-player';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

// Format number with K/M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// Comment item component
function CommentItem({
  comment,
  replies,
  activityId,
  onReply,
  currentUserId,
}: {
  comment: CommentData;
  replies: CommentData[];
  activityId: string;
  onReply: (commentId: string, username: string) => void;
  currentUserId?: string;
}) {
  const { isDark } = useAppTheme();
  const ct = glassText[isDark ? 'dark' : 'light'];
  const cBorder = glassBorder[isDark ? 'dark' : 'light'];
  const cSurface = glassSurfaceTint[isDark ? 'dark' : 'light'];

  const userCustom = comment.user?.custom;
  const commentUsername =
    userCustom?.userName ||
    comment.user?.name ||
    (userCustom?.firstName && userCustom?.lastName
      ? `${userCustom.firstName} ${userCustom.lastName}`
      : comment.user?.id) ||
    'user';
  const commentAvatar = comment.user?.image;

  const formatTime = (createdAt: string | number) => {
    try {
      const date = new Date(createdAt);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.commentCard, { borderColor: cBorder }]}>
      <GlassView {...liquidGlass.surface} tintColor={cSurface} borderRadius={14} style={StyleSheet.absoluteFillObject} />
      <View style={styles.commentInner}>
        <Image
          source={commentAvatar ? { uri: commentAvatar } : DefaultAvatarImage}
          style={[styles.commentAvatar, { borderColor: cBorder }]}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <View style={styles.commentHeaderLeft}>
              <Text style={[styles.commentUsername, { color: ct.primary }]}>
                @{commentUsername}
              </Text>
              <Text style={[styles.commentTime, { color: ct.muted }]}>
                · {formatTime(comment.created_at)}
              </Text>
            </View>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => onReply(comment.id, commentUsername)}
            >
              <Ionicons name="arrow-undo-outline" size={16} color={ct.muted} />
            </TouchableOpacity>
          </View>
          <LinkifiedText style={[styles.commentText, { color: ct.primary }] as any}>
            {comment.text}
          </LinkifiedText>
        </View>
      </View>
    </View>
  );
}

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { id: activityId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];

  const [commentText, setCommentText] = React.useState('');
  const [showComments, setShowComments] = React.useState(true);
  const [replyingToCommentId, setReplyingToCommentId] = React.useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = React.useState<string | null>(null);
  const [showMenu, setShowMenu] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const postId = activityId;

  // Fetch post
  const { post, isLoading, refetch: refetchPost } = usePost(postId);

  // Fetch comments
  const { comments: postComments, isLoading: commentsLoading, refetch: refetchComments } = usePostComments({
    postId,
    enabled: Boolean(postId),
  });

  const { refreshControl } = useRefreshControl({ onRefresh: async () => { await refetchPost(); await refetchComments(); } });

  // Hooks for mutations
  const { addComment, isAdding: isAddingComment } = useAddComment();
  const { like, unlike } = usePostReaction();
  const { deletePost, isDeleting } = useDeletePost();

  // Get post data
  const username =
    post?.authorUserName ||
    [post?.authorFirstName, post?.authorLastName].filter(Boolean).join(' ') ||
    'user';
  const userAvatar = post?.authorAvatarUrl;

  // Get media
  const firstMedia = post?.media?.[0];
  const imageUrl =
    post?.type === 'event'
      ? post.eventFlyerUrl || post.eventImageUrl || (firstMedia?.type === 'image' ? firstMedia.url : undefined)
      : firstMedia?.type === 'image'
        ? firstMedia.url
        : undefined;
  const videoUrl = firstMedia?.type === 'video' ? firstMedia.url : undefined;
  const thumbnailUrl = firstMedia?.thumbnailUrl || imageUrl;

  // Get reaction data
  const hasLiked = post?.isLiked ?? false;
  const likes = post?.likeCount ?? 0;

  // Format time
  const timeAgo = React.useMemo(() => {
    if (!post?.createdAt) return '';
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  }, [post?.createdAt]);

  // Comments are flat (no threading yet)
  const topLevelComments = postComments;

  // Handle like/unlike
  const handleLikeClick = async () => {
    if (!post) return;
    try {
      if (hasLiked) {
        await unlike({ postId: post.id });
      } else {
        await like({ postId: post.id });
      }
      await refetchPost();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!post || !commentText.trim() || isAddingComment) return;
    try {
      await addComment({
        postId: post.id,
        comment: commentText.trim(),
        parentId: replyingToCommentId ? Number(replyingToCommentId) : undefined,
      });
      setCommentText('');
      setReplyingToCommentId(null);
      setReplyingToUsername(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  // Handle reply click
  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingToCommentId(commentId);
    setReplyingToUsername(username);
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyingToUsername(null);
  };

  const isOwnPost = user && post?.authorId && String(user.id) === String(post.authorId);

  const handleShare = async () => {
    setShowMenu(false);
    try {
      await Share.share({
        message: post?.text
          ? `Check out this post on Status: "${post.text}"`
          : 'Check out this post on Status!',
      });
    } catch {}
  };

  const handleDeletePost = async () => {
    if (!post) return;
    try {
      await deletePost(Number(post.id));
      setShowDeleteConfirm(false);
      router.back();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <DarkGradientBg />
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <DarkGradientBg />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: border }]}
          onPress={() => router.back()}
        >
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={20} color={t.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.primary }]}>Post</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Post Author */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.authorSection}>
          <View style={styles.authorRow}>
            <TouchableOpacity
              style={styles.authorTouchable}
              onPress={() => {
                if (post?.authorId) {
                  router.push({
                    pathname: '/user/[username]',
                    params: { username: post.authorUserName || '_', userId: String(post.authorId) },
                  });
                }
              }}
            >
              <Image
                source={userAvatar ? { uri: userAvatar } : DefaultAvatarImage}
                style={styles.authorAvatar}
              />
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={[styles.authorUsername, { color: colors.text }]}>
                    @{username}
                  </Text>
                </View>
                <Text style={[styles.authorTime, { color: colors.textTertiary }]}>
                  {timeAgo}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Post Media */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.mediaSection}
        >
          {videoUrl ? (
            <FeedMediaPlayer
              mediaType="video"
              videoUrl={videoUrl}
              poster={thumbnailUrl}
              isActive={true}
              containerWidth={SCREEN_WIDTH}
              onDoubleTap={handleLikeClick}
            />
          ) : imageUrl ? (
            <FeedMediaPlayer
              mediaType="image"
              imageUrl={imageUrl}
              isActive={true}
              containerWidth={SCREEN_WIDTH}
              onDoubleTap={handleLikeClick}
            />
          ) : (
            <View style={[styles.noMedia, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={[styles.actionsSection, { borderBottomColor: colors.border }]}
        >
          <TouchableOpacity style={styles.actionButton} onPress={handleLikeClick}>
            <Ionicons
              name={hasLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={hasLiked ? '#ff4444' : colors.text}
            />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {formatNumber(likes)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {formatNumber(topLevelComments.length)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {/* Description */}
        {post?.text && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={[styles.descriptionSection, { borderBottomColor: colors.border }]}
          >
            <LinkifiedText style={[styles.descriptionText, { color: colors.text }] as any}>
              {`@${username} ${post?.text}`}
            </LinkifiedText>
          </Animated.View>
        )}

        {/* Comments toggle */}
        <TouchableOpacity
          style={[styles.viewCommentsButton, { borderBottomColor: border }]}
          onPress={() => setShowComments(!showComments)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={t.muted} />
          <Text style={[styles.viewCommentsText, { color: t.muted }]}>
            {showComments ? 'Hide comments' : `View all ${topLevelComments.length} comments`}
          </Text>
          <Ionicons name={showComments ? 'chevron-up' : 'chevron-down'} size={16} color={t.muted} />
        </TouchableOpacity>

        {/* Comments Section */}
        {showComments && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.commentsSection}
          >
            {commentsLoading ? (
              <ActivityIndicator size="small" color={t.muted} style={styles.commentsLoading} />
            ) : topLevelComments.length === 0 ? (
              <Text style={[styles.noCommentsText, { color: t.muted }]}>
                No comments yet. Be the first to comment!
              </Text>
            ) : (
              topLevelComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    replies={[]}
                    activityId={postId || ''}
                    onReply={handleReplyClick}
                    currentUserId={user ? String(user.id) : undefined}
                  />
              ))
            )}
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Comment Input */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={[
          styles.commentInputContainer,
          { borderTopColor: border, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Reply indicator */}
        {replyingToUsername && (
          <View style={[styles.replyIndicator, { borderColor: border, overflow: 'hidden' as const }]}>
            <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={8} style={StyleSheet.absoluteFillObject} />
            <Text style={[styles.replyIndicatorText, { color: t.tertiary }]}>
              Replying to <Text style={styles.replyIndicatorUsername}>@{replyingToUsername}</Text>
            </Text>
            <TouchableOpacity onPress={handleCancelReply}>
              <Text style={[styles.cancelReplyText, { color: t.tertiary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.commentInputRow}>
          <Image
            source={user?.avatar?.url ? { uri: user.avatar.url } : DefaultAvatarImage}
            style={[styles.commentInputAvatar, { borderColor: border }]}
          />
          <View style={[styles.commentInput, { borderColor: border, overflow: 'hidden' as const }]}>
            <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={20} style={StyleSheet.absoluteFillObject} />
            <TextInput
              style={{ flex: 1, height: '100%', paddingHorizontal: 16, fontSize: 14, fontFamily: 'Lato_400Regular', color: t.primary }}
              placeholder={
                replyingToUsername
                  ? `Reply to @${replyingToUsername}...`
                : 'Add a comment...'
            }
            placeholderTextColor={t.faint}
            value={commentText}
            onChangeText={setCommentText}
              multiline={false}
              editable={!isAddingComment}
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, { overflow: 'hidden' as const }]}
            onPress={handleCommentSubmit}
            disabled={!commentText.trim() || isAddingComment}
          >
            <GlassView
              {...liquidGlass.surface}
              tintColor={commentText.trim() && !isAddingComment ? 'rgba(255,255,255,0.2)' : surfaceTint}
              borderRadius={18}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons
              name="send"
              size={16}
              color={commentText.trim() && !isAddingComment ? t.primary : t.muted}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Options Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuBlur}>
              <GlassView
                {...liquidGlass.surface}
                borderRadius={14}
                style={StyleSheet.absoluteFill}
              />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.menuItemText}>Share</Text>
              </TouchableOpacity>

              {isOwnPost && (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                    <Text style={[styles.menuItemText, { color: '#ff3b30' }]}>Delete Post</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.menuCancelButton}
              onPress={() => setShowMenu(false)}
              activeOpacity={0.7}
            >
              <View style={styles.menuCancelBlur}>
                <GlassView
                  {...liquidGlass.surface}
                  borderRadius={14}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.menuCancelText}>Cancel</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteConfirmContainer}>
            <View style={styles.deleteConfirmContent}>
              <GlassView
                {...liquidGlass.surface}
                borderRadius={20}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.deleteConfirmHeader}>
                <View style={styles.deleteIconCircle}>
                  <Ionicons name="trash" size={28} color="#ff3b30" />
                </View>
                <Text style={styles.deleteConfirmTitle}>Delete Post</Text>
                <Text style={styles.deleteConfirmMessage}>
                  This will permanently remove this post and all its comments. This action cannot be undone.
                </Text>
              </View>

              <View style={styles.deleteConfirmActions}>
                <TouchableOpacity
                  style={styles.deleteConfirmCancelBtn}
                  onPress={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteConfirmDeleteBtn, isDeleting && { opacity: 0.5 }]}
                  onPress={handleDeletePost}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.deleteConfirmDeleteText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  authorSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorUsername: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  authorTime: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  mediaSection: {
    width: SCREEN_WIDTH,
  },
  noMedia: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  descriptionSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },
  descriptionUsername: {
    fontFamily: 'Lato_700Bold',
  },
  viewCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  viewCommentsText: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentsTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  commentsLoading: {
    marginVertical: 20,
  },
  noCommentsText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  commentInner: {
    flexDirection: 'row',
    padding: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  commentUsername: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },
  commentTime: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
  commentText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    lineHeight: 18,
    marginTop: 2,
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0,0,0,0.1)',
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  replyIndicatorText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  replyIndicatorUsername: {
    fontFamily: 'Lato_700Bold',
  },
  cancelReplyText: {
    fontSize: 12,
    fontFamily: 'Lato_600SemiBold',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  // Options menu
  menuContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  menuBlur: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
  },
  menuCancelButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuCancelBlur: {
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuCancelText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  // Delete confirmation
  deleteConfirmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deleteConfirmContent: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  deleteConfirmHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  deleteIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  deleteConfirmMessage: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  deleteConfirmCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
  },
  deleteConfirmCancelText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  deleteConfirmDeleteBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  deleteConfirmDeleteText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#ff3b30',
  },
});
