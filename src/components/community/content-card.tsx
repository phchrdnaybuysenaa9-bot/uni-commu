import { GradientSurface } from './gradient-surface';
import { colors, fontSize, lineHeight, size, spacing } from '@/constants/design-tokens';
import { PostPhotoCover } from './post-photo-cover';
import { Icon } from './icon';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDemo } from '@/features/community/demo-context';
import { useComments } from '@/features/community/comments-context';
import { demoToday, type ContentItem } from '@/features/community/mock-data';
import { Action } from './action';
import { PostAction } from './post-action';
import { s } from './styles';

export function ContentCard({ item, layout = 'cards' }: { item: ContentItem; layout?: 'cards' | 'feed' }) {
  const demo = useDemo();
  const { activePostId, openComments } = useComments();
  const [expanded, setExpanded] = useState(false);
  const commenting = activePostId === item.id;
  const [reporting, setReporting] = useState(false);
  const isAnnouncement = item.kind === 'announcement';
  const feed = layout === 'feed' && !isAnnouncement;
  const isDark = !isAnnouncement || !!item.urgent;
  const isSaved = demo.saved.includes(item.id);
  const isLiked = demo.liked.includes(item.id);
  const likeCount = item.live ? item.likes : item.likes + Number(isLiked);
  const commentCount = item.live ? item.commentCount ?? 0 : demo.comments[item.id]?.length ?? 0;
  const dateLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH', { day:'numeric',month:'short',year:'numeric' }) : item.date === demoToday ? 'วันนี้' : item.date.slice(8) + ' ต.ค. 2569';
  const author = <View style={[s.authorRow, feed && f.authorRow]}>
    <View style={s.avatar}>{isAnnouncement ? <Icon name="school" /> : <Text style={s.avatarText}>{item.author.slice(0, 1)}</Text>}</View>
    <View style={s.authorInfo}>
      <View style={s.toolbar}><Text style={[s.author, { flexShrink: 1 }, isDark && { color: colors.nightText }]}>{item.author}</Text>{item.verified && <Icon name="verified" color={isDark ? colors.nightText : colors.purple} />}</View>
      <Text numberOfLines={feed ? 1 : undefined} style={[s.small, isDark && { color: feed ? colors.nightMuted : colors.nightText }]}>{feed ? [item.faculty,item.category].filter(Boolean).join(' · ') : `${item.verified ? 'หน่วยงานรับรอง (จำลอง) · ' : ''}${dateLabel}`}</Text>
    </View>
    {!isAnnouncement && <Pressable accessibilityRole="button" accessibilityLabel="รายงานโพสต์นี้" onPress={() => setReporting(!reporting)} style={s.action}><Icon name="more" color={colors.nightText} /></Pressable>}
  </View>;
  const actions = <View style={[s.footer, feed && f.actions]}>
      {!isAnnouncement && <>
        <PostAction dark={isDark} icon="heart" selectedIcon="heartFilled" label={`${isLiked ? 'เลิกถูกใจ' : 'ถูกใจ'}, ${likeCount} คนถูกใจ`} count={likeCount} selected={isLiked} onPress={() => demo.toggleLiked(item.id)} />
        <PostAction dark={isDark} icon="comment" label={`เปิดความคิดเห็น, ${commentCount} ความคิดเห็น`} count={commentCount} expanded={commenting} onPress={() => openComments(item.id)} />
      </>}
      <View style={s.grow} />
      <PostAction dark={isDark} icon="bookmark" selectedIcon="bookmarkFilled" label={isSaved ? 'เลิกบันทึกโพสต์' : 'บันทึกโพสต์'} selected={isSaved} onPress={() => demo.toggleSaved(item.id)} />
  </View>;
  const report = <>
    {reporting && !demo.reported.includes(item.id) && <View style={[s.inset, feed && f.inset]}><Text style={[s.body, isDark && { color: colors.nightText }]}>รายงานเนื้อหาไม่เหมาะสม เช่น เนื้อหา 18+ หรือการคุกคาม</Text><Text style={[s.small, isDark && { color: colors.nightText }]}>รายงานนี้จะถูกบันทึกเพื่อให้ผู้ดูแลตรวจสอบ</Text><View style={s.row}><Action dark={isDark} label="ยืนยันรายงาน" primary onPress={() => { void demo.report(item.id); setReporting(false); }} /><Action dark={isDark} label="ยกเลิก" onPress={() => setReporting(false)} /></View></View>}
    {demo.reported.includes(item.id) && <Text accessibilityLiveRegion="polite" style={[s.small, isDark && { color: colors.nightText }, feed && f.inset]}>บันทึกรายงานแล้ว</Text>}
  </>;

  if (feed) {
    const collapsible = item.body.length > 100;
    const caption = <View style={f.caption}>
      {!item.live && <Text style={f.title}>{item.title}</Text>}
      <Text style={f.body} numberOfLines={collapsible && !expanded ? 2 : undefined}>{item.body}</Text>
      {collapsible && <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? 'ย่อเนื้อหา' : 'อ่านเพิ่มเติม'} ${item.title}`} onPress={() => setExpanded(!expanded)} style={f.more}><Text style={f.secondary}>{expanded ? 'ย่อเนื้อหา' : 'อ่านเพิ่มเติม'}</Text></Pressable>}
      {item.tags.length > 0 && <Text style={f.tags}>{item.tags.map(tag => `#${tag}`).join('  ')}</Text>}
      {!!item.programs?.length && <Text style={f.tags}>{item.programs.map(p=>p.name).join(' · ')}</Text>}
      {!!item.faculties?.length && <View style={s.tagRow}>{item.faculties.map(faculty=><Text key={faculty.id} style={s.tag}>{faculty.name}</Text>)}</View>}
      <Pressable accessibilityRole="button" accessibilityLabel={`เปิดความคิดเห็นของโพสต์ ${item.title}`} onPress={() => openComments(item.id)} style={f.more}><Text style={f.secondary}>{commentCount > 0 ? `ดูความคิดเห็นทั้งหมด ${commentCount} รายการ` : 'เพิ่มความคิดเห็น…'}</Text></Pressable>
      <Text style={f.date}>{dateLabel}</Text>
    </View>;
    return <GradientSurface testID={`feed-post-${item.id}`} enabled={false} style={f.post}>
      {author}
      {item.photo ? <><PostPhotoCover photo={item.photo} title={item.title} category={item.category} layout="feed" />{actions}{caption}</> : <>{caption}{actions}</>}
      {report}
    </GradientSurface>;
  }

  return <GradientSurface enabled={isDark} style={[s.card, item.urgent && s.urgentCard]}>
    {(item.urgent || item.pinned) && <Text style={[s.urgentLabel, isDark && { color: colors.nightText }]}>{[item.urgent && 'ประกาศด่วน', item.pinned && 'ปักหมุด'].filter(Boolean).join(' · ')}</Text>}
    {author}
    <Text style={[s.small, isDark && { color: colors.nightText }]}>{item.faculty} · {item.category}</Text>
    {!isAnnouncement && item.photo ? <PostPhotoCover photo={item.photo} title={item.title} category={item.category} /> : <Text style={[s.cardTitle, isDark && { color: colors.nightText }]}>{item.title}</Text>}
    <Text style={[s.body, isDark && { color: colors.nightText }]} numberOfLines={expanded ? undefined : 3}>{item.body}</Text>
    <View style={s.row}><Action dark={isDark} icon="arrow" label={expanded ? 'ย่อเนื้อหา' : 'อ่านทั้งหมด'} onPress={() => setExpanded(!expanded)} />{isAnnouncement && <Action dark={isDark} icon="check" label={demo.following.includes(item.author) ? 'กำลังติดตาม' : 'ติดตามเพจ'} selected={demo.following.includes(item.author)} onPress={() => demo.toggleFollow(item.author)} />}</View>
    <View style={s.tagRow}>{item.tags.map(t => <Text key={t} style={s.tag}>#{t}</Text>)}</View>
    {actions}
    {report}
  </GradientSurface>;
}

const f = StyleSheet.create({
  post: { width: '100%', backgroundColor: colors.gradientGray },
  authorRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: 64 },
  actions: { borderTopWidth: 0, paddingTop: spacing.xs, paddingHorizontal: spacing.lg },
  caption: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.lg, gap: spacing.xs },
  title: { color: colors.nightText, fontSize: fontSize.body, lineHeight: lineHeight.body, fontWeight: '700' },
  body: { color: colors.nightText, fontSize: fontSize.body, lineHeight: lineHeight.body },
  tags: { color: colors.selected, fontSize: fontSize.label, lineHeight: lineHeight.label },
  more: { minHeight: size.touchTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  secondary: { color: colors.nightMuted, fontSize: fontSize.label, lineHeight: lineHeight.label },
  date: { color: colors.nightMuted, fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  inset: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
