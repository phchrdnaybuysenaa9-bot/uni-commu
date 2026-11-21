import { AccentBanner } from '@/components/community/accent-banner';
import { PageHeader } from '@/components/community/frame';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Action, Chips, Empty, Frame, Icon, s } from '@/components/community';
import { useDemo } from '@/features/community/demo-context';
export default function NotificationsScreen() {
  const demo = useDemo(); const [filter, setFilter] = useState('ทั้งหมด');
  const all = demo.items.filter(i => i.kind === 'announcement' && (i.urgent || demo.following.includes(i.author)));
  const items = all.filter(i => filter !== 'ยังไม่อ่าน' || !demo.read.includes(i.id));
  const unread = all.filter(i => !demo.read.includes(i.id)).length;
  return <Frame title={`การแจ้งเตือน (${unread})`} subtitle="ข่าวด่วนและข่าวจากเพจที่คุณติดตาม"><ScrollView contentContainerStyle={s.scroll}><PageHeader /><AccentBanner icon="bell" title={unread ? `มี ${unread} ข่าวที่ยังไม่ได้อ่าน` : 'อ่านข่าวครบแล้ว'} subtitle="ข่าวด่วนและข่าวจากเพจที่ติดตาม · ข้อมูลจำลอง" />
    <Action dark icon="check" label="ทำเครื่องหมายอ่านแล้วทั้งหมด" onPress={() => all.forEach(i => demo.markRead(i.id))} disabled={!unread} />
    <Chips dark values={['ทั้งหมด', 'ประกาศทางการ', 'ยังไม่อ่าน']} value={filter} onChange={setFilter} />
    <Text style={s.canvasSectionTitle}>ล่าสุด</Text>
    {!items.length && <Empty text="อ่านครบแล้ว กลับมาตรวจข่าวสารใหม่ได้ภายหลัง" />}
    {items.map(i => <Pressable accessibilityRole="button" accessibilityLabel={`${demo.read.includes(i.id) ? 'อ่านแล้ว' : 'ยังไม่อ่าน'} ${i.title}`} key={i.id} onPress={() => demo.markRead(i.id)} style={[s.notification, !demo.read.includes(i.id) && s.unread, i.urgent && s.urgentCard]}>
      <View style={s.authorRow}><View style={s.avatar}><Icon name={i.urgent ? 'announcement' : 'school'} /></View><View style={s.grow}><Text style={s.small}>{i.urgent ? 'ประกาศด่วน' : 'เพจที่ติดตาม'} · {i.author}</Text><Text style={s.cardTitle}>{i.title}</Text></View>{!demo.read.includes(i.id) && <View style={s.dot} />}</View><Text style={s.body}>{i.body}</Text><Text style={s.small}>{i.date} · {demo.read.includes(i.id) ? 'อ่านแล้ว' : 'แตะเพื่อทำเครื่องหมายว่าอ่านแล้ว'}</Text>
    </Pressable>)}
    <View style={s.notice}><Text style={s.small}>ข้อมูลจำลอง ไม่มีการส่ง Push Notification จริง</Text></View>
  </ScrollView></Frame>;
}
