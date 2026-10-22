import { PostPhotoCover } from '@/components/community/post-photo-cover';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Chips, ContentList, Field, Frame, Icon, s } from '@/components/community';
import { useDemo } from './demo-context';
export function FeedScreen() {
  const demo = useDemo();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState('');
  const [attachPhoto, setAttachPhoto] = useState(true);
  const items = demo.items.filter(i => i.kind === 'post' && (category === 'ทั้งหมด' || i.category === category) && [i.title, i.body, ...i.tags].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <Frame title="คุยกันในรั้วมหาวิทยาลัย" subtitle="เรื่องเรียน เรื่องเพื่อน และทุกวันของพวกเรา"><ContentList items={items} emptyText="ลองค้นหาคำอื่นหรือเลือกหมวดทั้งหมด" header={<View style={s.section}>
    <Field placeholder="ค้นหาโพสต์ แท็ก หรือหัวข้อที่สนใจ..." value={query} onChangeText={setQuery} />
    <View style={s.composer}><View style={s.avatar}><Icon name="edit" /></View><Text style={s.composerHint}>แชร์เรื่องราวหรือสอบถาม...</Text><Action icon="plus" label={composing ? 'ปิด' : 'สร้างโพสต์'} primary onPress={() => setComposing(!composing)} /></View>
    {composing && <View style={s.card}><Field placeholder="วันนี้อยากแบ่งปันอะไร? (ข้อมูลจำลอง)" value={body} onChangeText={setBody} multiline /><Action label={attachPhoto ? 'นำภาพตัวอย่างออก' : 'แนบภาพตัวอย่าง'} icon="plus" selected={attachPhoto} onPress={() => setAttachPhoto(!attachPhoto)} />{attachPhoto && <PostPhotoCover photo="study" title="เรื่องเล่าจากคุณ" category="ชีวิตในมหาวิทยาลัย" />}<Text style={s.small}>ภาพและโพสต์เป็นข้อมูลจำลอง ยังไม่อัปโหลดรูปจากเครื่อง · โพสต์เก็บในหน่วยความจำเท่านั้น รีโหลดแล้วจะหาย</Text><Action label="เผยแพร่โพสต์จำลอง" primary disabled={!body.trim()} onPress={() => { demo.publish(body, attachPhoto ? 'study' : undefined); setAttachPhoto(true); setBody(''); setQuery(''); setCategory('ทั้งหมด'); setComposing(false); }} /></View>}
    <Chips values={['ทั้งหมด', 'เรื่องเรียน', 'กิจกรรม', 'ชีวิตในมหาวิทยาลัย']} value={category} onChange={setCategory} />
    <View style={s.notice}><View style={s.toolbar}><Icon name="shield" /><Text style={[s.small, s.grow]}>กติกาชุมชน: เคารพซึ่งกันและกัน ไม่อนุญาตเนื้อหา 18+ การคุกคาม และการเผยข้อมูลส่วนตัว</Text></View></View>
    <Text style={s.canvasSmall}>โพสต์ในชุมชน · {items.length} รายการ</Text>
  </View>} /></Frame>;
}
