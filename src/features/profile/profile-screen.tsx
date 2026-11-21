import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { colors, size } from '@/constants/design-tokens';
import { Frame, Icon } from '@/components/community';
import { PostGrid } from '@/components/community/post-grid';
import { useAuth } from '@/features/auth/auth-context';
import { useDemo } from '@/features/community/demo-context';
import { useWebKeyboardInset } from '@/hooks/use-web-keyboard-inset';
import { p } from './styles';

type LibraryTab = 'posts' | 'saved' | 'following';
const libraryTabs = [
  { key: 'posts', label: 'โพสต์', accessibilityLabel: 'โพสต์ของฉัน', icon: 'community' },
  { key: 'saved', label: 'บันทึก', accessibilityLabel: 'รายการบันทึก', icon: 'bookmark' },
  { key: 'following', label: 'เพจ', accessibilityLabel: 'เพจที่ติดตาม', icon: 'school' },
] as const;
const roles = { student: 'นักศึกษา', department: 'หน่วยงานมหาวิทยาลัย', admin: 'ผู้ดูแลชุมชน' };

function ProfileSettings({ name, onSave, onClose }: { name: string; onSave: (name: string) => void; onClose: () => void }) {
  const { logout } = useAuth();
  const reduceMotion = useReducedMotion();
  const keyboardInset = useWebKeyboardInset();
  const [draft, setDraft] = useState(name);
  const [rules, setRules] = useState(false);
  return <Modal visible animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
    <SafeAreaView style={p.safe}>
      <KeyboardAvoidingView style={[p.safe, { paddingBottom: keyboardInset }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={p.settingsHeader}><Text accessibilityRole="header" style={p.heading}>แก้ไขโปรไฟล์</Text><Pressable accessibilityRole="button" accessibilityLabel="ปิดการตั้งค่าโปรไฟล์" onPress={() => { Keyboard.dismiss(); onClose(); }} style={p.iconButton}><View style={p.closeIcon}><Icon name="plus" color={colors.nightText} /></View></Pressable></View>
      <ScrollView contentContainerStyle={p.settingsContent} keyboardShouldPersistTaps="handled">
        <Text style={p.label}>ชื่อแสดงผล</Text>
        <TextInput accessibilityLabel="ชื่อแสดงผล" value={draft} onChangeText={setDraft} maxLength={100} style={p.input} />
        <Pressable accessibilityRole="button" accessibilityLabel="บันทึกชื่อแสดงผล" disabled={!draft.trim()} onPress={() => { onSave(draft.trim()); Keyboard.dismiss(); onClose(); }} style={p.editButton}><Text style={p.label}>บันทึกชื่อแสดงผล</Text></Pressable>
        <Text style={p.meta}>อีเมลใช้สำหรับยืนยันตัวตน และไม่แสดงบนโปรไฟล์</Text>
        <Pressable accessibilityRole="button" aria-expanded={rules} onPress={() => setRules(!rules)} style={p.settingsRow}><Icon name="shield" color={colors.nightText} /><Text style={p.label}>กติกาและมารยาทชุมชน</Text></Pressable>
        {rules && <Text style={p.meta}>เคารพผู้อื่น ห้ามเนื้อหา 18+ การคุกคาม และเผยข้อมูลส่วนตัว รายงานเนื้อหาที่ไม่เหมาะสมได้จากเมนูโพสต์</Text>}
        <Pressable accessibilityRole="button" onPress={() => { onClose(); router.navigate('/notifications'); }} style={p.settingsRow}><Icon name="bell" color={colors.nightText} /><Text style={p.label}>การแจ้งเตือนของฉัน</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { onClose(); logout(); }} style={p.settingsRow}><Text style={p.label}>ออกจากระบบ</Text></Pressable>
        <Link href="https://icons8.com" style={p.meta}>Icons by Icons8</Link>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

export function ProfileScreen() {
  const { session } = useAuth();
  const demo = useDemo();
  const loadLibrary=demo.loadLibrary;
  useEffect(()=>{void loadLibrary();},[loadLibrary]);
  const { tab: requestedTab } = useLocalSearchParams<{ tab?: string }>();
  const tab: LibraryTab = requestedTab === 'saved' || requestedTab === 'following' ? requestedTab : 'posts';
  const [name, setName] = useState(session?.name ?? 'สมาชิกชุมชน');
  const [settings, setSettings] = useState(false);
  const [savedFilter, setSavedFilter] = useState('ทั้งหมด');
  const ownPosts = demo.items.filter(item => item.kind === 'post' && item.authorId === session?.user.id);
  const saved = demo.items.filter(item => demo.saved.includes(item.id));
  const visibleSaved = saved.filter(item => savedFilter === 'ทั้งหมด' || (savedFilter === 'โพสต์' ? item.kind === 'post' : item.kind === 'announcement'));
  const items = tab === 'posts' ? ownPosts : tab === 'saved' ? visibleSaved : [];
  const selectTab = (next: LibraryTab) => router.setParams({ tab: next });

  const header = <View>
    <View style={p.header}><Text accessibilityRole="header" numberOfLines={1} style={p.heading}>{name}</Text><Pressable accessibilityRole="button" accessibilityLabel="การตั้งค่าโปรไฟล์" onPress={() => setSettings(true)} style={p.iconButton}><Icon name="more" color={colors.nightText} large /></Pressable></View>
    <View style={p.profile}>
      <View style={p.identity}>
        <View accessible={false} style={p.avatar}><Text style={p.initial}>{Array.from(name)[0]}</Text></View>
        <View style={p.stats}>
          {[{ key: 'posts', count: ownPosts.length, label: 'โพสต์' }, { key: 'saved', count: saved.length, label: 'บันทึก' }, { key: 'following', count: demo.following.length, label: 'ติดตามเพจ' }].map(stat => <Pressable key={stat.key} accessibilityRole="button" accessibilityLabel={`ดู${stat.label} ${stat.count} รายการ`} onPress={() => selectTab(stat.key as LibraryTab)} style={p.stat}><Text style={p.count}>{stat.count}</Text><Text style={p.statLabel}>{stat.label}</Text></Pressable>)}
        </View>
      </View>
      <Text style={p.label}>{session ? roles[session.user.role] : 'สมาชิก'}</Text>
      <Text style={p.meta}>พื้นที่ของคุณในชุมชนมหาวิทยาลัย</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="แก้ไขโปรไฟล์" onPress={() => setSettings(true)} style={p.editButton}><Icon name="edit" color={colors.nightText} /><Text style={p.label}>แก้ไขโปรไฟล์</Text></Pressable>
    </View>
    <View accessibilityRole="tablist" accessibilityLabel="เนื้อหาโปรไฟล์" style={p.tabs}>
      {libraryTabs.map(option => <Pressable key={option.key} accessibilityRole="tab" accessibilityLabel={option.accessibilityLabel} aria-selected={tab === option.key} onPress={() => selectTab(option.key)} style={[p.tab, tab === option.key && p.activeTab]}><Icon name={option.icon} color={tab === option.key ? colors.nightText : colors.nightMuted} /><Text style={[p.tabLabel, tab === option.key && p.activeLabel]}>{option.label}</Text></Pressable>)}
    </View>
    {tab === 'saved' && <View style={p.savedHeader}><Text style={p.meta}>รายการที่บันทึกไว้ เห็นได้เฉพาะคุณ</Text><View style={p.savedFilters}>{['ทั้งหมด', 'โพสต์', 'ประกาศ'].map(filter => <Pressable key={filter} accessibilityRole="button" accessibilityLabel={`กรองรายการบันทึก ${filter}`} aria-pressed={savedFilter === filter} onPress={() => setSavedFilter(filter)} style={[p.savedFilter, savedFilter === filter && p.selectedFilter]}><Text style={p.tabLabel}>{filter}</Text></Pressable>)}</View></View>}
  </View>;

  const empty = tab === 'following' ? <View style={p.following}>
    {demo.following.length === 0 && <Text style={p.meta}>ยังไม่มีเพจที่ติดตาม เลือกติดตามได้ในหน้าประกาศ</Text>}
    {demo.following.map(author => <View key={author} style={p.page}><View style={p.pageIcon}><Icon name="school" color={colors.selected} /></View><Text style={p.pageName}>{author}</Text><Pressable accessibilityRole="button" accessibilityLabel={`ยกเลิกติดตาม ${author}`} onPress={() => demo.toggleFollow(author)} style={p.iconButton}><Icon name="check" color={colors.selected} /></Pressable></View>)}
  </View> : undefined;

  return <Frame title="โปรไฟล์" subtitle="ตัวตนของคุณในชุมชน" maxWidth={size.contentWidth}>
    <PostGrid items={items} header={header} empty={empty} emptyText={tab === 'saved' ? 'ยังไม่มีรายการบันทึก กดบุ๊กมาร์กใต้โพสต์เพื่อเก็บไว้อ่าน' : 'ยังไม่มีโพสต์ของคุณ สร้างโพสต์ใหม่ได้จากหน้าแรก'} onOpen={item => router.push({ pathname: '/post/[id]', params: { id: item.id, from: 'profile' } })} />
    {settings && <ProfileSettings name={name} onSave={setName} onClose={() => setSettings(false)} />}
  </Frame>;
}
