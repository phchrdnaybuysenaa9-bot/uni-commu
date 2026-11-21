import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, lineHeight, radius, size, spacing } from '@/constants/design-tokens';
import { useAuth } from '@/features/auth/auth-context';
import { useDemo, type CommunityComment } from '@/features/community/demo-context';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useWebKeyboardInset } from '@/hooks/use-web-keyboard-inset';
import { CommentAvatar, CommentRow } from './comment-row';
import { Icon } from './icon';
import { requestId } from '@/features/community/community-api';

export type CommentDraft = { text: string; replyTo: string | null };

const quickReactions = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];
const nativeAnimation = Platform.OS !== 'web';
const noComments: CommunityComment[] = [];

export function CommentsSheet({ postId, draft, onChangeDraft, onClose }: {
  postId: string;
  draft: CommentDraft;
  onChangeDraft: (draft: CommentDraft) => void;
  onClose: () => void;
}) {
  const demo = useDemo();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { isTabletLayout } = useResponsiveLayout();
  const webKeyboardInset = useWebKeyboardInset();
  const reduceMotion = useReducedMotion();
  const sheetHeight = Math.min(height * 0.8, height - insets.top - spacing.lg);
  const [offset] = useState(() => new Animated.Value(reduceMotion ? 0 : height));
  const [backdrop] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [closing, setClosing] = useState(false);
  const scrollToNewComment = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<CommunityComment>>(null);
  const [expandedThreads, setExpandedThreads] = useState<string[]>([]);
  const [inputHeight, setInputHeight] = useState(size.touchTarget);
  const [sending,setSending]=useState(false);
  const [sendError,setSendError]=useState('');
  const sendingRef=useRef(false);
  const pending=useRef<{signature:string;id:string}|null>(null);
  const loadComments=demo.loadComments;
  useEffect(()=>{void loadComments(postId);},[loadComments,postId]);
  const comments = demo.comments[postId] ?? noComments;
  const { roots, replies } = useMemo(() => {
    const roots: CommunityComment[] = [];
    const replies = new Map<string, CommunityComment[]>();
    for (const comment of comments) {
      if (!comment.parentId) roots.push(comment);
      else {
        const thread = replies.get(comment.parentId);
        if (thread) thread.push(comment);
        else replies.set(comment.parentId, [comment]);
      }
    }
    return { roots, replies };
  }, [comments]);
  const replyingTo = comments.find(comment => comment.id === draft.replyTo);
  const canSend = !!session && !!draft.text.trim() && !sending;

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    Keyboard.dismiss();
    if (reduceMotion) return onClose();
    Animated.parallel([
      Animated.timing(offset, { toValue: height, duration: 190, easing: Easing.in(Easing.cubic), useNativeDriver: nativeAnimation }),
      Animated.timing(backdrop, { toValue: 0, duration: 190, useNativeDriver: nativeAnimation }),
    ]).start(({ finished }) => { if (finished) onClose(); });
  }, [backdrop, closing, height, offset, onClose, reduceMotion]);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(offset, { toValue: 0, duration: reduceMotion ? 0 : 260, easing: Easing.out(Easing.cubic), useNativeDriver: nativeAnimation }),
      Animated.timing(backdrop, { toValue: 1, duration: reduceMotion ? 0 : 200, useNativeDriver: nativeAnimation }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [backdrop, offset, reduceMotion]);

  const drag = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: () => offset.stopAnimation(),
    onPanResponderMove: (_, gesture) => offset.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 90 || gesture.vy > 0.8) close();
      else Animated.spring(offset, { toValue: 0, speed: 24, bounciness: 0, useNativeDriver: nativeAnimation }).start();
    },
    onPanResponderTerminate: () => Animated.spring(offset, { toValue: 0, speed: 24, bounciness: 0, useNativeDriver: nativeAnimation }).start(),
  }), [close, offset]);

  async function submit() {
    if (!canSend || !session || sendingRef.current) return;
    sendingRef.current=true;setSending(true);setSendError('');
    const rootId = replyingTo?.parentId ?? replyingTo?.id ?? null;
    const signature=JSON.stringify([postId,draft.text,rootId]);
    if(pending.current?.signature!==signature)pending.current={signature,id:requestId()};
    try{
      await demo.addComment(postId,draft.text,rootId,pending.current.id);
      if (rootId) setExpandedThreads(old => old.includes(rootId) ? old : [...old, rootId]);
      else scrollToNewComment.current = true;
      pending.current=null;setInputHeight(size.touchTarget);onChangeDraft({ text: '', replyTo: null });
    }catch(e){setSendError(e instanceof Error?e.message:'ส่งความคิดเห็นไม่ได้ กรุณาลองอีกครั้ง');}
    finally{sendingRef.current=false;setSending(false);}
  }

  function replyTo(comment: CommunityComment) {
    onChangeDraft({ ...draft, replyTo: comment.id });
    inputRef.current?.focus();
  }

  function toggleThread(id: string) {
    setExpandedThreads(old => old.includes(id) ? old.filter(thread => thread !== id) : [...old, id]);
  }

  return <Modal transparent visible animationType="none" statusBarTranslucent navigationBarTranslucent supportedOrientations={['portrait', 'landscape']} onRequestClose={close}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[c.overlay, { paddingTop: insets.top + spacing.lg, paddingBottom: webKeyboardInset }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.photoOverlay, opacity: backdrop }]} />
      <Pressable style={StyleSheet.absoluteFill} accessible={false} tabIndex={-1} onPress={close} />
      <Animated.View pointerEvents={closing ? 'none' : 'auto'} accessibilityViewIsModal onAccessibilityEscape={close} style={[c.sheet, { height: sheetHeight, transform: [{ translateY: offset }] }, isTabletLayout && c.tabletSheet]}>
        <View {...drag.panHandlers} style={c.sheetHeader}>
          <View accessible={false} style={c.handle} />
          <View style={c.headingRow}>
            <View style={c.headerSpace} />
            <Text accessibilityRole="header" style={c.heading}>ความคิดเห็น <Text style={c.total}>{comments.length}</Text></Text>
            <Pressable accessibilityRole="button" accessibilityLabel="ปิดหน้าความคิดเห็น" onPress={close} style={c.closeButton}>
              <View style={c.closeIcon}><Icon name="plus" color={colors.nightText} /></View>
            </Pressable>
          </View>
        </View>
        <FlatList
          ref={listRef}
          style={c.list}
          contentContainerStyle={[c.listContent, roots.length === 0 && c.emptyList]}
          data={roots}
          keyExtractor={comment => comment.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onContentSizeChange={() => {
            if (!scrollToNewComment.current) return;
            scrollToNewComment.current = false;
            listRef.current?.scrollToEnd({ animated: !reduceMotion });
          }}
          ListEmptyComponent={<View style={c.empty}>
            <Icon name="comment" color={colors.nightMuted} large />
            <Text style={c.emptyTitle}>ยังไม่มีความคิดเห็น</Text>
            <Text style={c.emptyHint}>เริ่มบทสนทนาเป็นคนแรก</Text>
          </View>}
          renderItem={({ item }) => {
            const thread = replies.get(item.id) ?? [];
            const expanded = expandedThreads.includes(item.id);
            return <View style={c.thread}>
              <CommentRow comment={item} onReply={() => replyTo(item)} onLike={() => demo.toggleCommentLike(postId, item.id)} />
              {thread.length > 0 && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => toggleThread(item.id)} style={c.threadToggle}>
                <View style={c.threadLine} />
                <Text style={c.threadLabel}>{expanded ? 'ซ่อนข้อความตอบกลับ' : `ดูข้อความตอบกลับ ${thread.length} รายการ`}</Text>
              </Pressable>}
              {expanded && thread.map(comment => <CommentRow key={comment.id} comment={comment} reply onReply={() => replyTo(comment)} onLike={() => demo.toggleCommentLike(postId, comment.id)} />)}
            </View>;
          }}
        />
        <View style={[c.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {!!(sendError||demo.error) && <Text accessibilityLiveRegion="assertive" style={c.replyNoticeText}>{sendError||demo.error}</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={c.reactions}>
            {quickReactions.map(emoji => <Pressable key={emoji} accessibilityRole="button" accessibilityLabel={`เพิ่ม ${emoji} ในความคิดเห็น`} disabled={draft.text.length + emoji.length > 2000} onPress={() => onChangeDraft({ ...draft, text: `${draft.text}${emoji}` })} style={c.reactionButton}><Text style={c.emoji}>{emoji}</Text></Pressable>)}
          </ScrollView>
          {replyingTo && <View style={c.replyNotice}>
            <Text numberOfLines={2} style={c.replyNoticeText}>กำลังตอบกลับ {replyingTo.author}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="ยกเลิกการตอบกลับ" onPress={() => onChangeDraft({ ...draft, replyTo: null })} style={c.closeButton}><View style={c.closeIcon}><Icon name="plus" color={colors.nightMuted} /></View></Pressable>
          </View>}
          <View style={c.inputRow}>
            <CommentAvatar name={session?.name ?? 'คุณ'} small />
            <View style={c.inputShell}>
              <TextInput
                ref={inputRef}
                value={draft.text}
                onChangeText={text => {
                  if (text.length < draft.text.length) setInputHeight(size.touchTarget);
                  onChangeDraft({ ...draft, text });
                }}
                accessibilityLabel="เขียนความคิดเห็น"
                placeholder="เพิ่มความคิดเห็น…"
                placeholderTextColor={colors.nightMuted}
                multiline
                editable={!sending}
                maxLength={2000}
                onContentSizeChange={event => setInputHeight(Math.max(size.touchTarget, Math.min(120, event.nativeEvent.contentSize.height)))}
                style={[c.input, { height: inputHeight }]}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="ส่งความคิดเห็น" accessibilityState={{ disabled: !canSend }} disabled={!canSend} onPress={submit} style={c.sendButton}><Text style={[c.sendLabel, !canSend && c.sendDisabled]}>ส่ง</Text></Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  </Modal>;
}

const c = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: size.contentWidth, maxHeight: '100%', flexShrink: 1, backgroundColor: colors.gradientGray, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, overflow: 'hidden' },
  tabletSheet: { marginBottom: spacing.lg, borderBottomLeftRadius: radius.card, borderBottomRightRadius: radius.card },
  sheetHeader: { paddingTop: spacing.md, paddingHorizontal: spacing.sm, borderBottomWidth: size.border, borderBottomColor: colors.nightBorder },
  handle: { alignSelf: 'center', width: size.touchTarget, height: spacing.xs, borderRadius: radius.full, backgroundColor: colors.nightMuted, marginBottom: spacing.xs },
  headingRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.xs },
  headerSpace: { width: size.touchTarget },
  heading: { flex: 1, textAlign: 'center', fontSize: fontSize.section, lineHeight: lineHeight.heading, fontWeight: '700', color: colors.nightText },
  total: { color: colors.nightMuted, fontSize: fontSize.label, fontWeight: '400' },
  closeButton: { minWidth: size.touchTarget, minHeight: size.touchTarget, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { transform: [{ rotate: '45deg' }] },
  list: { flex: 1, minHeight: 0 },
  listContent: { padding: spacing.lg, gap: spacing.xl },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  thread: { gap: spacing.sm },
  threadToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: size.touchTarget, marginLeft: size.avatar + spacing.md },
  threadLine: { width: spacing.xl, height: size.border, backgroundColor: colors.nightBorder },
  threadLabel: { flexShrink: 1, fontSize: fontSize.caption, lineHeight: lineHeight.caption, fontWeight: '600', color: colors.nightMuted },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyTitle: { color: colors.nightText, fontSize: fontSize.section, lineHeight: lineHeight.heading, fontWeight: '600' },
  emptyHint: { color: colors.nightMuted, fontSize: fontSize.label, lineHeight: lineHeight.label },
  composer: { borderTopWidth: size.border, borderTopColor: colors.nightBorder, paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.xs },
  reactions: { gap: spacing.xs, alignItems: 'center' },
  reactionButton: { minWidth: size.touchTarget, minHeight: size.touchTarget, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: fontSize.brand, lineHeight: lineHeight.heading },
  replyNotice: { flexDirection: 'row', alignItems: 'center', paddingLeft: size.avatar, gap: spacing.sm },
  replyNoticeText: { flex: 1, color: colors.nightMuted, fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  inputShell: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-end', borderWidth: size.border, borderColor: colors.nightBorder, borderRadius: radius.control, paddingLeft: spacing.lg },
  input: { flex: 1, minWidth: 0, minHeight: size.touchTarget, maxHeight: 120, paddingTop: spacing.md, paddingBottom: spacing.md, paddingRight: spacing.xs, color: colors.nightText, fontSize: fontSize.body, lineHeight: lineHeight.label, textAlignVertical: 'top' },
  sendButton: { minWidth: size.touchTarget, minHeight: size.touchTarget, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.md },
  sendLabel: { color: colors.selected, fontSize: fontSize.label, lineHeight: lineHeight.label, fontWeight: '700' },
  sendDisabled: { color: colors.nightMuted },
});
