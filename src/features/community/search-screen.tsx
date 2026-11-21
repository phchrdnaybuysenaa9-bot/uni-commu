import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fontSize, lineHeight, radius, size, spacing } from '@/constants/design-tokens';
import { Frame, Icon } from '@/components/community';
import { PostGrid } from '@/components/community/post-grid';
import { useAuth } from '@/features/auth/auth-context';
import { communityRequest,contentFromApi,type ApiPost } from './community-api';
import type { ContentItem } from './mock-data';

export function SearchScreen() {
  const {session}=useAuth();
  const token=session?.token;
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const [results,setResults]=useState<{term:string;items:ContentItem[];cursor:string|null;error:string}>({term:'\0',items:[],cursor:null,error:''});
  const [loadingMore,setLoadingMore]=useState(false);
  const busy=useRef(false);
  useEffect(()=>{
    if(!token)return;
    let current=true;
    const timer=setTimeout(()=>{
      void communityRequest<{items:ApiPost[];nextCursor:string|null}>(token,`/posts?q=${encodeURIComponent(term)}&limit=30`).then(page=>{
        if(current)setResults({term,items:page.items.map(contentFromApi),cursor:page.nextCursor,error:''});
      }).catch(e=>{if(current)setResults({term,items:[],cursor:null,error:e instanceof Error?e.message:'ค้นหาไม่ได้ กรุณาลองอีกครั้ง'});});
    },250);
    return ()=>{current=false;clearTimeout(timer);};
  },[term,token]);
  const searching=results.term!==term;
  const items=results.term===term?results.items:[];
  async function loadMore(){
    if(!token||!results.cursor||busy.current||searching)return;
    busy.current=true;setLoadingMore(true);
    try{
      const page=await communityRequest<{items:ApiPost[];nextCursor:string|null}>(token,`/posts?q=${encodeURIComponent(term)}&limit=30&cursor=${encodeURIComponent(results.cursor)}`);
      setResults(old=>old.term===term?{...old,items:[...old.items,...page.items.map(contentFromApi)],cursor:page.nextCursor,error:''}:old);
    }catch(e){setResults(old=>({...old,error:e instanceof Error?e.message:'โหลดเพิ่มเติมไม่ได้'}));}
    finally{busy.current=false;setLoadingMore(false);}
  }
  const header = <View style={q.header}>
    <View style={q.search}>
      <Icon name="search" color={colors.nightMuted} />
      <TextInput accessibilityLabel="ค้นหาโพสต์ แท็ก หรือหัวข้อที่สนใจ" placeholder="ค้นหาโพสต์หรือแท็ก" placeholderTextColor={colors.nightMuted} value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} style={q.input} />
      {!!query && <Pressable accessibilityRole="button" accessibilityLabel="ล้างคำค้นหา" onPress={() => setQuery('')} style={q.clear}><View style={q.closeIcon}><Icon name="plus" color={colors.nightMuted} /></View></Pressable>}
    </View>
    {!!term && <Text accessibilityLiveRegion="polite" style={q.summary}>{searching?'กำลังค้นหา…':results.error||`พบ ${items.length}${results.cursor?'+':''} โพสต์สำหรับ “${query.trim()}”`}</Text>}
  </View>;
  return <Frame title="ค้นหา" subtitle="ค้นพบเรื่องราวในมหาวิทยาลัย" maxWidth={size.contentWidth}>
    <PostGrid items={items} header={header} footer={!searching&&results.cursor?<Pressable accessibilityRole="button" disabled={loadingMore} onPress={()=>void loadMore()} style={{minHeight:size.touchTarget,padding:spacing.md,alignItems:'center'}}><Text style={q.summary}>{loadingMore?'กำลังโหลด…':'โหลดผลลัพธ์เพิ่มเติม'}</Text></Pressable>:undefined} emptyText={searching?'กำลังค้นหา…':results.error||'ไม่พบโพสต์ ลองค้นหาคำอื่นหรือแฮชแท็กที่สนใจ'} onOpen={item => { Keyboard.dismiss(); router.push({ pathname: '/post/[id]', params: { id: item.id, from: 'explore' } }); }} />
  </Frame>;
}

const q = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
  search: { flexDirection: 'row', alignItems: 'center', minHeight: size.touchTarget, paddingLeft: spacing.lg, gap: spacing.sm, borderRadius: radius.full, backgroundColor: colors.nightInput },
  input: { flex: 1, minWidth: 0, color: colors.nightText, minHeight: size.touchTarget, fontSize: fontSize.body, lineHeight: lineHeight.body, paddingVertical: spacing.sm, paddingRight: spacing.md },
  clear: { minWidth: size.touchTarget, minHeight: size.touchTarget, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { transform: [{ rotate: '45deg' }] },
  summary: { color: colors.nightMuted, fontSize: fontSize.caption, lineHeight: lineHeight.caption },
});
