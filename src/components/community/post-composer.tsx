import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { colors, fontSize, lineHeight, size, spacing } from '@/constants/design-tokens';
import { useAuth } from '@/features/auth/auth-context';
import { useWebKeyboardInset } from '@/hooks/use-web-keyboard-inset';
import { Action } from './action';
import { CommentAvatar } from './comment-row';
import { PostPhotoCover } from './post-photo-cover';
import { Chips } from './chips';

export type PostDraft = { body: string; category: string; photo?: { uri:string; base64:string; width:number; height:number; mediaId?:string } };

export function PostComposer({ draft, onChangeDraft, onClose, onPublish, publishing=false, error='', mediaEnabled=false }: {
  draft: PostDraft;
  onChangeDraft: (draft: PostDraft) => void;
  onClose: () => void;
  onPublish: () => void;
  publishing?: boolean;
  error?: string;
  mediaEnabled?: boolean;
}) {
  const [photoError,setPhotoError]=useState('');
  const [picking,setPicking]=useState(false);
  const { session } = useAuth();
  const reduceMotion = useReducedMotion();
  const keyboardInset = useWebKeyboardInset();
  const canPublish = !!draft.body.trim() && !publishing && !picking;
  async function pickPhoto() {
    setPicking(true);setPhotoError('');
    try {
      const selected=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],base64:true,quality:0.85});
      if(selected.canceled)return;
      const image=selected.assets[0];
      if(!image.base64 || image.base64.length>7_000_000){setPhotoError('กรุณาเลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB');return;}
      onChangeDraft({...draft,photo:{uri:image.uri,base64:image.base64,width:image.width,height:image.height}});
    }catch{setPhotoError('เปิดคลังรูปไม่ได้ กรุณาตรวจสิทธิ์การเข้าถึงรูปแล้วลองอีกครั้ง');}
    finally{setPicking(false);}
  }
  function close() {
    if(publishing)return;
    Keyboard.dismiss();
    onClose();
  }

  return <Modal visible animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={close} supportedOrientations={['portrait', 'landscape']}>
    <SafeAreaView style={p.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={[p.safe, { paddingBottom: keyboardInset }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={p.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="ปิดหน้าสร้างโพสต์" disabled={publishing} onPress={close} style={p.headerAction}><Text style={p.cancel}>ยกเลิก</Text></Pressable>
          <Text accessibilityRole="header" style={p.title}>สร้างโพสต์</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="เผยแพร่โพสต์" disabled={!canPublish} accessibilityState={{ disabled: !canPublish, busy:publishing }} onPress={() => { Keyboard.dismiss(); onPublish(); }} style={p.headerAction}><Text style={[p.publish, !canPublish && p.disabled]}>{publishing?'กำลังส่ง…':'เผยแพร่'}</Text></Pressable>
        </View>
        <ScrollView style={p.scroll} contentContainerStyle={p.content} keyboardShouldPersistTaps="handled">
          <View style={p.identity}>
            <CommentAvatar name={session?.name ?? 'คุณ'} />
            <View style={p.identityText}><Text style={p.author}>{session?.name ?? 'คุณ'}</Text><Text style={p.hint}>แชร์กับชุมชนมหาวิทยาลัย</Text></View>
          </View>
          <TextInput accessibilityLabel="เนื้อหาโพสต์" placeholder="อยากแบ่งปันอะไรกับเพื่อน ๆ ใส่ #แฮชแท็ก ได้ที่นี่" placeholderTextColor={colors.nightMuted} value={draft.body} onChangeText={body => onChangeDraft({ ...draft, body })} editable={!publishing} multiline maxLength={2000} autoFocus style={p.input} />
          {!publishing && <Chips dark values={['เรื่องเรียน','กิจกรรม','ชีวิตในมหาวิทยาลัย']} value={draft.category} onChange={category=>onChangeDraft({...draft,category})} />}
          {!publishing && !picking && mediaEnabled && <Action dark icon="plus" label={draft.photo?'นำรูปออก':'เพิ่มรูปภาพ'} selected={!!draft.photo} onPress={()=>draft.photo?onChangeDraft({...draft,photo:undefined}):void pickPhoto()} />}
          {picking && <Text style={p.hint}>กำลังเลือกรูป…</Text>}
          {!mediaEnabled && <Text style={p.hint}>ขณะนี้เผยแพร่ได้เฉพาะข้อความ</Text>}
          {draft.photo && <PostPhotoCover photo={draft.photo} title="รูปแนบโพสต์" category={draft.category} layout="feed" />}
          {!!(error||photoError) && <Text accessibilityLiveRegion="assertive" style={p.hint}>{error||photoError}</Text>}
          <Text style={p.hint}>เคารพซึ่งกันและกัน ไม่โพสต์เนื้อหา 18+ ไม่คุกคาม และไม่เผยข้อมูลส่วนตัวของผู้อื่น</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const p = StyleSheet.create({
  safe: { flex: 1, minHeight: 0, backgroundColor: colors.gradientGray },
  header: { width: '100%', maxWidth: size.contentWidth, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  headerAction: { minHeight: size.touchTarget, minWidth: size.touchTarget, paddingHorizontal: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: fontSize.section, lineHeight: lineHeight.heading, fontWeight: '700', color: colors.nightText },
  cancel: { fontSize: fontSize.label, color: colors.nightMuted },
  publish: { fontSize: fontSize.label, fontWeight: '700', color: colors.selected },
  disabled: { color: colors.nightMuted },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: size.contentWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: spacing.xs },
  author: { color: colors.nightText, fontSize: fontSize.body, lineHeight: lineHeight.body, fontWeight: '700' },
  hint: { color: colors.nightMuted, fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  input: { minHeight: 140, fontSize: fontSize.body, lineHeight: lineHeight.body, color: colors.nightText, paddingVertical: spacing.sm, textAlignVertical: 'top' },
});
