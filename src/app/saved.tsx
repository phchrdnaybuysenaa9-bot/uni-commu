import { AccentBanner } from '@/components/community/accent-banner';
import { useState } from 'react';
import { View } from 'react-native';
import { Chips, ContentList, Frame, s } from '@/components/community';
import { useDemo } from '@/features/community/demo-context';
export default function SavedScreen() {
  const demo = useDemo(); const [filter, setFilter] = useState('ทั้งหมด');
  const saved = demo.items.filter(i => demo.saved.includes(i.id));
  const items = saved.filter(i => filter === 'ทั้งหมด' || (filter === 'โพสต์ชุมชน' ? i.kind === 'post' : i.kind === 'announcement'));
  return <Frame title="รายการที่บันทึกไว้" subtitle={`รวบรวมโพสต์และประกาศที่คุณอยากกลับมาอ่าน · ${saved.length} รายการ`}><ContentList items={items} header={<View style={s.section}><AccentBanner icon="bookmark" title={`เก็บไว้อ่าน ${saved.length} รายการ`} subtitle="โพสต์และประกาศที่คุณเลือกบันทึกไว้" /><Chips values={['ทั้งหมด', 'โพสต์ชุมชน', 'ประกาศทางการ']} value={filter} onChange={setFilter} /></View>} emptyText="กดบันทึกที่โพสต์หรือประกาศ แล้วกลับมาดูได้ที่นี่" /></Frame>;
}
