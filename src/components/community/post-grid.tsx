import { useState, type ReactNode } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fontSize, lineHeight, spacing, size } from '@/constants/design-tokens';
import type { ContentItem } from '@/features/community/mock-data';
import { Empty } from './empty';
import { Icon } from './icon';
import { postPhotoSource } from './post-photo-cover';

function GridTile({ item, width, onOpen }: { item: ContentItem; width: number; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  const image = item.photo && !failed;
  return <Pressable testID={`post-grid-${item.id}`} accessibilityRole="button" accessibilityLabel={`เปิด${item.kind === 'announcement' ? 'ประกาศ' : 'โพสต์'} ${item.title}`} onPress={onOpen} style={({ pressed }) => [g.tile, { width }, pressed && { opacity: 0.75 }]}>
    {image ? <Image accessible={false} source={postPhotoSource(item.photo!)} onError={() => setFailed(true)} resizeMode="cover" style={[StyleSheet.absoluteFill, g.image]} /> : <View style={g.textTile}><Icon name={item.kind === 'announcement' ? 'school' : 'community'} color={colors.selected} large /><Text numberOfLines={4} style={g.textTitle}>{item.title}</Text></View>}
    {image && <View style={g.caption}><Text numberOfLines={2} style={g.title}>{item.title}</Text></View>}
  </Pressable>;
}

export function PostGrid({ items, header, footer, emptyText, empty, onOpen }: {
  items: ContentItem[];
  header?: ReactNode;
  footer?: ReactNode;
  emptyText: string;
  empty?: ReactNode;
  onOpen: (item: ContentItem) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const width = measuredWidth ?? Math.min(windowWidth, size.contentWidth);
  return <FlatList
    style={g.list}
    onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}
    data={items}
    numColumns={3}
    keyExtractor={item => item.id}
    renderItem={({ item }) => <GridTile item={item} width={Math.max(0, (width - 4) / 3)} onOpen={() => onOpen(item)} />}
    columnWrapperStyle={g.row}
    contentContainerStyle={g.content}
    ListHeaderComponent={header ? <>{header}</> : undefined}
    ListFooterComponent={footer ? <>{footer}</> : undefined}
    ListEmptyComponent={empty ? <>{empty}</> : <Empty text={emptyText} />}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
  />;
}

const g = StyleSheet.create({
  list: { flex: 1, minHeight: 0 },
  content: { gap: 2, paddingBottom: spacing.xxl },
  row: { gap: 2 },
  tile: { aspectRatio: 3 / 4, overflow: 'hidden', backgroundColor: colors.gradientPurple, justifyContent: 'flex-end' },
  image: { width: '100%', height: '100%' },
  textTile: { flex: 1, padding: spacing.md, gap: spacing.sm, justifyContent: 'center' },
  textTitle: { color: colors.nightText, fontSize: fontSize.label, lineHeight: lineHeight.label, fontWeight: '600' },
  caption: { backgroundColor: colors.photoOverlay, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  title: { color: colors.nightText, fontSize: fontSize.caption, lineHeight: lineHeight.caption, fontWeight: '600' },
});
