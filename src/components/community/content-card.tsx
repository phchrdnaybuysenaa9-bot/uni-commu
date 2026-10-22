import { GradientSurface } from './gradient-surface';
import { colors } from '@/constants/design-tokens';
import { PostPhotoCover } from './post-photo-cover';
import { Icon } from './icon';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useDemo } from '@/features/community/demo-context';
import { demoToday, type ContentItem } from '@/features/community/mock-data';
import { Action } from './action';
import { Field } from './field';
import { s } from './styles';

export function ContentCard({ item }: { item: ContentItem }) {
  const demo = useDemo();
  const [expanded, setExpanded] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState('');
  const [reporting, setReporting] = useState(false);
  const isAnnouncement = item.kind === 'announcement';
  const isDark = !isAnnouncement || !!item.urgent;
  const isSaved = demo.saved.includes(item.id);
  const isLiked = demo.liked.includes(item.id);
  return <GradientSurface enabled={isDark} style={[s.card, item.urgent && s.urgentCard]}>
    {(item.urgent || item.pinned) && <Text style={[s.urgentLabel, isDark && { color: colors.nightText }]}>{[item.urgent && 'ประกาศด่วน', item.pinned && 'ปักหมุด'].filter(Boolean).join(' · ')}</Text>}
    <View style={s.authorRow}><View style={s.avatar}>{isAnnouncement ? <Icon name="school" /> : <Text style={s.avatarText}>{item.author.slice(0, 1)}</Text>}</View><View style={s.authorInfo}><View style={s.toolbar}><Text style={[s.author, { flexShrink: 1 }, isDark && { color: colors.nightText }]}>{item.author}</Text>{item.verified && <Icon name="verified" color={isDark ? colors.nightText : colors.purple} />}</View><Text style={[s.small, isDark && { color: colors.nightText }]}>{item.verified ? 'หน่วยงานรับรอง (จำลอง) · ' : ''}{item.date === demoToday ? 'วันนี้' : item.date.slice(8) + ' ต.ค. 2569'}</Text></View>{!isAnnouncement && <Pressable accessibilityRole="button" accessibilityLabel="รายงานโพสต์นี้" onPress={() => setReporting(!reporting)} style={s.action}><Icon name="more" color={colors.nightText} /></Pressable>}</View>
    <Text style={[s.small, isDark && { color: colors.nightText }]}>{item.faculty} · {item.category}</Text>
    {!isAnnouncement && item.photo ? <PostPhotoCover photo={item.photo} title={item.title} category={item.category} /> : <Text style={[s.cardTitle, isDark && { color: colors.nightText }]}>{item.title}</Text>}
    <Text style={[s.body, isDark && { color: colors.nightText }]} numberOfLines={expanded ? undefined : 3}>{item.body}</Text>
    <View style={s.row}><Action dark={isDark} icon="arrow" label={expanded ? 'ย่อเนื้อหา' : 'อ่านทั้งหมด'} onPress={() => setExpanded(!expanded)} />{isAnnouncement && <Action dark={isDark} icon="check" label={demo.following.includes(item.author) ? 'กำลังติดตาม' : 'ติดตามเพจ'} selected={demo.following.includes(item.author)} onPress={() => demo.toggleFollow(item.author)} />}</View>
    <View style={s.tagRow}>{item.tags.map(t => <Text key={t} style={s.tag}>#{t}</Text>)}</View>
    <View style={s.footer}>{!isAnnouncement && <><Action dark={isDark} icon="heart" label={`ถูกใจ ${item.likes + Number(isLiked)}`} selected={isLiked} onPress={() => demo.toggleLiked(item.id)} /><Action dark={isDark} icon="comment" label={`คอมเมนต์ ${demo.comments[item.id]?.length ?? 0}`} selected={commenting} onPress={() => setCommenting(!commenting)} /></>}<Action dark={isDark} icon="bookmark" label={isSaved ? 'บันทึกแล้ว' : 'บันทึก'} selected={isSaved} onPress={() => demo.toggleSaved(item.id)} /></View>
    {reporting && !demo.reported.includes(item.id) && <View style={s.inset}><Text style={[s.body, isDark && { color: colors.nightText }]}>รายงานเนื้อหาไม่เหมาะสม เช่น เนื้อหา 18+ หรือการคุกคาม</Text><Text style={[s.small, isDark && { color: colors.nightText }]}>จำลองการรายงานหนึ่งครั้งต่อบัญชี ยังไม่ส่งให้แอดมินและยังไม่ซ่อนโพสต์อัตโนมัติ</Text><View style={s.row}><Action dark={isDark} label="ยืนยันรายงาน" primary onPress={() => { demo.report(item.id); setReporting(false); }} /><Action dark={isDark} label="ยกเลิก" onPress={() => setReporting(false)} /></View></View>}
    {demo.reported.includes(item.id) && <Text accessibilityLiveRegion="polite" style={[s.small, isDark && { color: colors.nightText }]}>รับรายงานจำลองแล้ว · ไม่มีการส่งข้อมูลออก</Text>}
    {commenting && <View style={s.inset}>{(demo.comments[item.id] ?? []).map((text, i) => <Text key={i} style={[s.body, isDark && { color: colors.nightText }]}>คุณ: {text}</Text>)}<Field value={comment} onChangeText={setComment} placeholder="แสดงความคิดเห็นอย่างเคารพกัน" multiline /><Action dark={isDark} label="ส่งความคิดเห็น" primary disabled={!comment.trim()} onPress={() => { demo.addComment(item.id, comment); setComment(''); }} /></View>}
  </GradientSurface>;
}
