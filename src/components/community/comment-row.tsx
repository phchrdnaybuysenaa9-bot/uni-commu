import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, lineHeight, radius, size, spacing } from '@/constants/design-tokens';
import type { CommunityComment } from '@/features/community/demo-context';
import { PostAction } from './post-action';

function timeLabel(createdAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาที`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} ชม.`;
  return `${Math.floor(minutes / 1440)} วัน`;
}

export function CommentAvatar({ name, small = false }: { name: string; small?: boolean }) {
  return <View accessible={false} style={[c.avatar, small && c.smallAvatar]}>
    <Text style={c.initial}>{Array.from(name)[0] ?? ''}</Text>
  </View>;
}

export function CommentRow({ comment, reply = false, onReply, onLike }: {
  comment: CommunityComment;
  reply?: boolean;
  onReply: () => void;
  onLike: () => void;
}) {
  return <View style={[c.row, reply && c.reply]}>
    <CommentAvatar name={comment.author} small={reply} />
    <View style={c.content}>
      <View style={c.identity}>
        <Text style={c.name}>{comment.author}</Text>
        <Text accessibilityLabel={new Date(comment.createdAt).toLocaleString('th-TH')} style={c.time}>{timeLabel(comment.createdAt)}</Text>
      </View>
      <Text selectable style={c.body}>{comment.body}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`ตอบกลับ ${comment.author}`} onPress={onReply} style={c.replyButton}>
        <Text style={c.replyLabel}>ตอบกลับ</Text>
      </Pressable>
    </View>
    <PostAction
      dark
      stacked
      icon="heart"
      selectedIcon="heartFilled"
      selected={comment.liked}
      count={comment.likeCount || undefined}
      label={`${comment.liked ? 'เลิกถูกใจ' : 'ถูกใจ'}ความคิดเห็นของ ${comment.author}`}
      onPress={onLike}
    />
  </View>;
}

const c = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  reply: { marginLeft: size.avatar + spacing.md },
  avatar: { width: size.avatar, height: size.avatar, borderRadius: radius.full, backgroundColor: colors.gradientPurple, alignItems: 'center', justifyContent: 'center' },
  smallAvatar: { width: size.avatar - spacing.sm, height: size.avatar - spacing.sm },
  initial: { fontSize: fontSize.body, fontWeight: '700', color: colors.selected },
  content: { flex: 1, minWidth: 0, gap: spacing.xs },
  identity: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: spacing.sm },
  name: { fontSize: fontSize.label, lineHeight: lineHeight.label, fontWeight: '700', color: colors.nightText, flexShrink: 1 },
  time: { fontSize: fontSize.caption, lineHeight: lineHeight.caption, color: colors.nightMuted },
  body: { fontSize: fontSize.body, lineHeight: lineHeight.body, color: colors.nightText },
  replyButton: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: size.touchTarget, paddingRight: spacing.md },
  replyLabel: { fontSize: fontSize.caption, lineHeight: lineHeight.caption, fontWeight: '600', color: colors.nightMuted },
});
