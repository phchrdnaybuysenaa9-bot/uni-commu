import { PageHeader } from './frame';
import type { ReactNode } from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { spacing } from '@/constants/design-tokens';
import type { ContentItem } from '@/features/community/mock-data';
import { ContentCard } from './content-card';
import { Empty } from './empty';
import { s } from './styles';

export function ContentList({ items, header, emptyText, layout = 'cards', refreshing, onRefresh, onEndReached, loadingMore }: { items: ContentItem[]; header?: ReactNode; emptyText: string; layout?: 'cards' | 'feed'; refreshing?: boolean; onRefresh?:()=>void; onEndReached?:()=>void; loadingMore?:boolean }) {
  const feed = layout === 'feed';
  return <FlatList
    style={{ flex: 1 }}
    data={items}
    keyExtractor={item => item.id}
    renderItem={({ item }) => <ContentCard item={item} layout={layout} />}
    ListHeaderComponent={feed ? <>{header}</> : <><PageHeader />{header}</>}
    ListEmptyComponent={<Empty text={emptyText} />}
    contentContainerStyle={feed ? l.feed : s.list}
    keyboardShouldPersistTaps="handled"
    refreshing={refreshing}
    onRefresh={onRefresh}
    onEndReached={onEndReached}
    onEndReachedThreshold={0.3}
    ListFooterComponent={loadingMore?<ActivityIndicator accessibilityLabel="กำลังโหลดโพสต์เพิ่ม" />:null}
  />;
}

const l = StyleSheet.create({
  feed: { paddingBottom: spacing.xxl },
});
