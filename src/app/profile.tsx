import { GradientSurface } from '@/components/community/gradient-surface';
import { PageHeader } from '@/components/community/frame';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Action, Field, Frame, Icon, s } from '@/components/community';
import { useAuth } from '@/features/auth/auth-context';
import { useDemo } from '@/features/community/demo-context';
import { p } from '@/features/profile/styles';
export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const demo = useDemo();
  const [name, setName] = useState(session?.name ?? 'เพื่อนในมหาวิทยาลัย');
  const [draft, setDraft] = useState(name);
  const [editing, setEditing] = useState(false);
  const [rules, setRules] = useState(false);
  return <Frame title="โปรไฟล์ของฉัน" subtitle="ตัวตนของคุณในชุมชนมหาวิทยาลัย">
    <ScrollView style={p.viewport} contentContainerStyle={p.content} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never">
      <PageHeader />
      <GradientSurface style={p.hero}>
        <View style={p.identity}><View style={p.avatar}><Icon name="profile" large /></View><View style={p.info}><Text style={p.name}>{name}</Text><Text style={p.heroMeta}>นักศึกษา</Text><Text style={p.heroMeta}>วิทยาศาสตร์และเทคโนโลยี</Text></View></View>
        <View style={p.privacy}><Icon name="shield" /><Text style={[p.heroMeta, s.grow]}>อีเมลไม่แสดงต่อสาธารณะ{ '\n' }บัญชีและการยืนยันเป็นข้อมูลจำลอง</Text></View>
        <Action icon="edit" label={editing ? 'ยกเลิกแก้ไข' : 'แก้ไขชื่อแสดงผล'} primary onPress={() => { setDraft(name); setEditing(!editing); }} />
        {editing && <View style={p.section}><Field placeholder="ชื่อแสดงผล" value={draft} onChangeText={setDraft} multiline /><Action label="บันทึกชื่อ" primary disabled={!draft.trim()} onPress={() => { setName(draft.trim()); setEditing(false); }} /></View>}
        <View style={p.stats}>{[[demo.saved.length, 'บันทึกไว้'], [demo.liked.length, 'ถูกใจ'], [demo.following.length, 'ติดตามเพจ']].map(([count, label]) => <View key={label} style={p.stat}><Text style={p.count}>{count}</Text><Text style={p.statLabel}>{label}</Text></View>)}</View>
      </GradientSurface>
      <View style={p.section}>
        <View style={p.sectionHeading}><Text style={p.sectionTitle}>เพจที่ติดตาม</Text><Text style={s.canvasSmall}>{demo.following.length} เพจ</Text></View>
        {demo.following.length ? <View style={p.list}>{demo.following.map((author, index) => <View key={author} style={[p.page, index === demo.following.length - 1 && p.last]}>
          <View style={s.avatar}><Icon name="school" /></View><View style={p.info}><Text style={p.pageName}>{author}</Text><Text style={p.pageMeta}>หน่วยงานรับรอง · จำลอง</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`ยกเลิกติดตาม ${author}`} onPress={() => demo.toggleFollow(author)} style={p.compactButton}><Icon name="check" /></Pressable>
        </View>)}</View> : <Text style={s.canvasMuted}>ยังไม่มีเพจที่ติดตาม เลือกติดตามได้ในหน้าประกาศ</Text>}
      </View>
      <View style={p.section}><Text style={p.sectionTitle}>บัญชีและชุมชน</Text><View style={p.list}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: rules }} onPress={() => setRules(!rules)} style={p.page}><Icon name="shield" /><Text style={[p.pageName, s.grow]}>กติกาและมารยาทชุมชน</Text><Icon name="arrow" /></Pressable>
        {rules && <Text style={[p.meta, { paddingVertical: 16 }]}>เคารพผู้อื่น ห้ามเนื้อหา 18+ การคุกคาม และเผยข้อมูลส่วนตัว รายงานเนื้อหาที่ไม่เหมาะสมได้จากเมนูโพสต์</Text>}
        <Link href="/notifications" asChild><Pressable style={p.page}><Icon name="bell" /><Text style={[p.pageName, s.grow]}>การแจ้งเตือนของฉัน</Text><Icon name="arrow" /></Pressable></Link>
        <Link href="/saved" asChild><Pressable style={StyleSheet.flatten([p.page, p.last])}><Icon name="bookmark" /><Text style={[p.pageName, s.grow]}>รายการที่บันทึก</Text><Icon name="arrow" /></Pressable></Link>
      </View></View>
      <View style={p.footer}><Action label="ออกจากระบบจำลอง" icon="arrow" onPress={logout} /><Text style={s.canvasSmall}>UniCommu · ข้อมูลจำลอง</Text><Link href="https://icons8.com" style={s.canvasSmall}>Icons by Icons8</Link></View>
    </ScrollView>
  </Frame>;
}
