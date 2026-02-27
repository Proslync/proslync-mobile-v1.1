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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  usePost,
  usePostComments,
  useAddComment,
  usePostReaction,
  type CommentData,
} from '@/hooks';
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
  const { colors } = useAppTheme();

  // Get comment user info
  const userCustom = comment.user?.custom;
  const commentUsername =
    userCustom?.userName ||
    comment.user?.name ||
    (userCustom?.firstName && userCustom?.lastName
      ? `${userCustom.firstName} ${userCustom.lastName}`
      : comment.user?.id) ||
    'user';
  const commentAvatar = comment.user?.image;
  const isReply = false; // Threading not yet supported in our backend

  // Format time
  const formatTime = (createdAt: string | number) => {
    try {
      const date = new Date(createdAt);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.commentItem, isReply && styles.commentReply]}>
      <Image
        source={commentAvatar ? { uri: commentAvatar } : DefaultAvatarImage}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUsername, { color: colors.text }]}>
            @{commentUsername}
          </Text>
          <Text style={[styles.commentTime, { color: colors.textTertiary }]}>
            {formatTime(comment.created_at)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.text }]}>
          {comment.text}
        </Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => onReply(comment.id, commentUsername)}
          >
            <Text style={[styles.commentActionText, { color: colors.textTertiary }]}>
              Reply
            </Text>
          </TouchableOpacity>
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
  const { colors } = useAppTheme();

  const [commentText, setCommentText] = React.useState('');
  const [showComments, setShowComments] = React.useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = React.useState<string | null>(null);
  const [replyingToUsername, setReplyingToUsername] = React.useState<string | null>(null);

  const postId = activityId;

  // Fetch post
  const { post, isLoading, refetch: refetchPost } = usePost(postId);

  // Fetch comments
  const { comments: postComments, isLoading: commentsLoading } = usePostComments({
    postId,
    enabled: Boolean(postId),
  });

  // Hooks for mutations
  const { addComment, isAdding: isAddingComment } = useAddComment();
  const { like, unlike } = usePostReaction();

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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Post Author */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.authorSection}>
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => {
              if (post?.authorId) {
                router.push({
                  pathname: '/user-profile/[userId]',
                  params: { userId: String(post.authorId) },
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
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              <Text style={styles.descriptionUsername}>@{username}</Text>{' '}
              {post?.text}
            </Text>
          </Animated.View>
        )}

        {/* View comments button */}
        <TouchableOpacity
          style={[styles.viewCommentsButton, { borderBottomColor: colors.border }]}
          onPress={() => setShowComments(!showComments)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.textTertiary} />
          <Text style={[styles.viewCommentsText, { color: colors.textTertiary }]}>
            {showComments ? 'Hide comments' : `View all ${topLevelComments.length} comments`}
          </Text>
        </TouchableOpacity>

        {/* Comments Section */}
        {showComments && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.commentsSection}
          >
            <Text style={[styles.commentsTitle, { color: colors.text }]}>Comments</Text>
            {commentsLoading ? (
              <ActivityIndicator size="small" color={colors.text} style={styles.commentsLoading} />
            ) : topLevelComments.length === 0 ? (
              <Text style={[styles.noCommentsText, { color: colors.textTertiary }]}>
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
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Reply indicator */}
        {replyingToUsername && (
          <View style={[styles.replyIndicator, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.replyIndicatorText, { color: colors.textTertiary }]}>
              Replying to <Text style={styles.replyIndicatorUsername}>@{replyingToUsername}</Text>
            </Text>
            <TouchableOpacity onPress={handleCancelReply}>
              <Text style={[styles.cancelReplyText, { color: colors.textTertiary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.commentInputRow}>
          <Image
            source={user?.avatar?.url ? { uri: user.avatar.url } : DefaultAvatarImage}
            style={styles.commentInputAvatar}
          />
          <TextInput
            style={[
              styles.commentInput,
              { backgroundColor: colors.backgroundSecondary, color: colors.text },
            ]}
            placeholder={
              replyingToUsername
                ? `Reply to @${replyingToUsername}...`
                : 'Add a comment...'
            }
            placeholderTextColor={colors.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline={false}
            editable={!isAddingComment}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: commentText.trim() && !isAddingComment
                  ? '#3897F0'
                  : colors.backgroundSecondary,
              },
            ]}
            onPress={handleCommentSubmit}
            disabled={!commentText.trim() || isAddingComment}
          >
            <Ionicons
              name="send"
              size={18}
              color={commentText.trim() && !isAddingComment ? '#fff' : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    padding: 8,
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  headerSpacer: {
    width: 44,
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
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentReply: {
    marginLeft: 0,
    marginTop: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
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
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontFamily: 'Lato_600SemiBold',
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
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
