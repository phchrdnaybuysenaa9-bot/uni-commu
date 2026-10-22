import { FilterOverlay } from '@/components/community/filter-overlay';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, ContentList, Field, Frame, s } from '@/components/community';
import { useDemo } from './demo-context';
import { demoToday } from './mock-data';
export function AnnouncementsScreen() {
  const demo = useDemo();
  const [query, setQuery] = useState('');
  const [faculty, setFaculty] = useState('ทุกคณะ');
  const [category, setCategory] = useState('ทั้งหมด');
  const [date, setDate] = useState('ทุกช่วงเวลา');
  const [filters, setFilters] = useState(false);
  const items = demo.items.filter(i => i.kind === 'announcement' && (faculty === 'ทุกคณะ' || i.faculty === faculty || i.faculty === 'ทุกคณะ') && (category === 'ทั้งหมด' || i.category === category) && (date !== 'วันนี้' || i.date === demoToday) && (date !== '7 วันล่าสุด' || i.date >= '2026-10-17') && [i.title, i.body, i.author, ...i.tags].join(' ').includes(query.trim())).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date));
  const reset = () => { setQuery(''); setFaculty('ทุกคณะ'); setCategory('ทั้งหมด'); setDate('ทุกช่วงเวลา'); };
  return <Frame title="ประกาศและข่าวสารทางการ" subtitle="ข่าวสารจากหน่วยงาน ตรงถึงคุณ"><ContentList items={items} emptyText="ไม่พบประกาศ ลองล้างตัวกรองหรือเปลี่ยนคำค้น" header={<View style={s.section}>
    <Field placeholder="ค้นหาประกาศ หน่วยงาน หรือ #แท็ก" value={query} onChangeText={setQuery} />
    <View style={s.row}><Action icon="filter" label="ตัวกรอง" selected={filters} onPress={() => setFilters(true)} /><Action label="ล้างตัวกรอง" onPress={reset} /></View>

    <Text style={s.canvasSmall}>{items.length} ประกาศ · {faculty} · {category} · {date}</Text>
    <Text style={s.canvasMuted}>ประกาศปักหมุดแสดงก่อน · การรับรองและเนื้อหาทั้งหมดเป็นตัวอย่าง</Text>
  </View>} />{filters && <FilterOverlay value={{ faculty, category, date }} onClose={() => setFilters(false)} onApply={next => { setFaculty(next.faculty); setCategory(next.category); setDate(next.date); setFilters(false); }} />}</Frame>;
}
