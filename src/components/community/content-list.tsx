import { PageHeader } from './frame';
import type { ReactNode } from 'react';
import { FlatList } from 'react-native';
import type { ContentItem } from '@/features/community/mock-data';
import { ContentCard } from './content-card';
import { Empty } from './empty';
import { s } from './styles';

export function ContentList({ items, header, emptyText }: { items: ContentItem[]; header?: ReactNode; emptyText: string }) {
  return <FlatList style={{ flex: 1 }} data={items} keyExtractor={item => item.id} renderItem={({ item }) => <ContentCard item={item} />} ListHeaderComponent={<><PageHeader />{header}</>} ListEmptyComponent={<Empty text={emptyText} />} contentContainerStyle={s.list} keyboardShouldPersistTaps="handled" />;
}
