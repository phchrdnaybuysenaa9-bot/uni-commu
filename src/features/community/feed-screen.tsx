import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandLogo } from '@/components/brand-logo';
import { Chips, ContentList, Frame, Icon } from '@/components/community';
import { PostComposer, type PostDraft } from '@/components/community/post-composer';
import { colors, fontSize, lineHeight, size, spacing } from '@/constants/design-tokens';
import { useDemo } from './demo-context';

export function FeedScreen() {
  const demo = useDemo();
  const [category, setCategory] = useState('ทั้งหมด');
  const [choosingCategory, setChoosingCategory] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<PostDraft>({ body: '', category:'ชีวิตในมหาวิทยาลัย' });
  const [publishing,setPublishing]=useState(false);
  const [publishError,setPublishError]=useState('');
  const inFlight=useRef(false);
  const pending=useRef<{signature:string;id:string}|null>(null);
  async function publish() {
    if(inFlight.current)return;
    inFlight.current=true;setPublishing(true);setPublishError('');
    try{
      let mediaId=draft.photo?.mediaId;
      if(draft.photo && !mediaId){
        mediaId=(await demo.upload(draft.photo.base64)).id;
        setDraft({...draft,photo:{...draft.photo,mediaId}});
      }
      const signature=JSON.stringify([draft.body,draft.category,mediaId]);
      if(pending.current?.signature!==signature)pending.current={signature,id:demo.newRequestId()};
      await demo.publish(draft.body,draft.category,pending.current.id,mediaId);
      pending.current=null;setDraft({body:'',category:'ชีวิตในมหาวิทยาลัย'});
      setCategory('ทั้งหมด');demo.setCategory('');setChoosingCategory(false);setComposing(false);
    }catch(e){setPublishError(e instanceof Error?e.message:'เผยแพร่โพสต์ไม่ได้ กรุณาลองอีกครั้ง');}
    finally{inFlight.current=false;setPublishing(false);}
  }
  const items = demo.items.filter(item => item.kind === 'post' && demo.feedIds.includes(item.id) &&
    (category === 'ทั้งหมด' || item.category === category));

  const header = <View style={f.header}>
    <View style={f.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel="สร้างโพสต์" onPress={() => setComposing(true)} style={f.iconButton}><Icon name="plus" color={colors.nightText} large /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`เลือกหมวดหมู่โพสต์, ${category}`} aria-expanded={choosingCategory} onPress={() => setChoosingCategory(!choosingCategory)} style={f.brand}>
        <BrandLogo dimension={32} />
        <View style={f.brandCopy}><Text accessibilityRole="header" style={f.name}>UniCommu</Text><Text numberOfLines={1} style={f.categoryLabel}>{category}</Text></View>
        <View style={{ transform: [{ rotate: choosingCategory ? '-90deg' : '90deg' }] }}><Icon name="arrow" color={colors.nightMuted} /></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="ค้นหาโพสต์" onPress={() => router.navigate('/explore')} style={f.iconButton}><Icon name="search" color={colors.nightText} large /></Pressable>
    </View>
    {choosingCategory && <View style={f.categories}><Chips dark values={['ทั้งหมด', 'เรื่องเรียน', 'กิจกรรม', 'ชีวิตในมหาวิทยาลัย']} value={category} onChange={value => { setCategory(value); demo.setCategory(value==='ทั้งหมด'?'':value); setChoosingCategory(false); }} /></View>}
  </View>;

  return <Frame title="ชุมชนมหาวิทยาลัย" subtitle="เรื่องเรียน เรื่องเพื่อน และทุกวันของพวกเรา" maxWidth={size.contentWidth}>
    <ContentList layout="feed" items={items} emptyText={demo.loading?'กำลังโหลดโพสต์…':demo.error?'ยังโหลดโพสต์ไม่ได้':'ยังไม่มีโพสต์ในหมวดนี้ เริ่มแบ่งปันเรื่องราวเป็นคนแรกได้เลย'} header={header} refreshing={demo.loading} onRefresh={()=>void demo.refresh()} onEndReached={()=>void demo.loadMore()} loadingMore={demo.loadingMore} />
    {composing && <PostComposer draft={draft} onChangeDraft={value=>{setDraft(value);setPublishError('');}} onClose={() => setComposing(false)} onPublish={()=>void publish()} publishing={publishing} error={publishError} mediaEnabled={demo.mediaEnabled} />}
  </Frame>;
}

const f = StyleSheet.create({
  header: { backgroundColor: colors.gradientGray },
  toolbar: { minHeight: 64, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: size.touchTarget, minHeight: size.touchTarget, alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1, minWidth: 0, minHeight: size.touchTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  brandCopy: { flexShrink: 1, alignItems: 'center' },
  name: { color: colors.nightText, fontSize: fontSize.section, lineHeight: lineHeight.heading, fontWeight: '800' },
  categoryLabel: { color: colors.nightMuted, fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  categories: { paddingHorizontal: spacing.lg },
});
