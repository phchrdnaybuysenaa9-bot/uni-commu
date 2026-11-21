import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import {
  communityRequest,
  contentFromApi,
  requestId,
  type ApiPost,
  type CommunityComment,
} from './community-api';
import type { ContentItem } from './mock-data';

export function useCommunityPosts() {
  const { session } = useAuth();
  const token = session?.token;
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [feedIds, setFeedIds] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [loadedCategory, setLoadedCategory] = useState<string | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>(
    {},
  );
  const [loading, setLoading] = useState(!!token);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [mediaEnabled, setMediaEnabled] = useState(false);
  const busy = useRef(new Set<string>());
  const libraryRequested = useRef(false);
  const generation = useRef(0);
  const request = useCallback(
    <T>(path: string, method = 'GET', data?: object) => {
      if (!token) return Promise.reject(new Error('กรุณาเข้าสู่ระบบอีกครั้ง'));
      return communityRequest<T>(token, path, method, data);
    },
    [token],
  );
  const merge = useCallback((items: ApiPost[], replace = false) => {
    const converted = items.map(contentFromApi);
    setPosts((old) =>
      replace
        ? converted
        : [
            ...old.filter((p) => !items.some((i) => i.id === p.id)),
            ...converted,
          ].sort(
            (a, b) =>
              (b.createdAt ?? '').localeCompare(a.createdAt ?? '') ||
              b.id.localeCompare(a.id),
          ),
    );
    const update = (old: string[], key: 'liked' | 'saved') => [
      ...(replace ? [] : old.filter((id) => !items.some((i) => i.id === id))),
      ...items.filter((i) => i[key]).map((i) => i.id),
    ];
    setLiked((old) => update(old, 'liked'));
    setSaved((old) => update(old, 'saved'));
  }, []);
  const fetchData = useCallback(async () => {
    return Promise.all([
      request<{ items: ApiPost[]; nextCursor: string | null }>(
        `/posts${category ? `?category=${encodeURIComponent(category)}` : ''}`,
      ),
      request<{ mediaEnabled: boolean }>('/catalog'),
    ]);
  }, [request, category]);
  const applyData = useCallback(
    ([page, catalog]: Awaited<ReturnType<typeof fetchData>>) => {
      merge(page.items);
      setFeedIds(page.items.map((post) => post.id));
      setLoadedCategory(category);
      setNextCursor(page.nextCursor);
      setMediaEnabled(catalog.mediaEnabled);
    },
    [merge, category],
  );
  const readLibrary = useCallback(
    async (filter: 'saved' | 'mine') => {
      const items: ApiPost[] = [];
      let cursor: string | null = null;
      do {
        const page: { items: ApiPost[]; nextCursor: string | null } =
          await request(
            `/posts?${filter}=1&limit=30${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
          );
        items.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);
      return items;
    },
    [request],
  );
  const loadLibrary = useCallback(() => {
    libraryRequested.current = true;
    return Promise.all([readLibrary('saved'), readLibrary('mine')])
      .then(([bookmarks, own]) => {
        merge(bookmarks);
        merge(own);
        setSaved(bookmarks.map((post) => post.id));
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'โหลดรายการของคุณไม่ได้'),
      );
  }, [readLibrary, merge]);
  const refresh = useCallback(async () => {
    if (!token || busy.current.has('feed')) return;
    busy.current.add('feed');
    setLoading(true);
    setError('');
    const version = generation.current;
    try {
      const data = await fetchData();
      if (version !== generation.current) return;
      applyData(data);
      if (libraryRequested.current) await loadLibrary();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดโพสต์ไม่ได้');
    } finally {
      if (version === generation.current) {
        busy.current.delete('feed');
        setLoading(false);
      }
    }
  }, [token, fetchData, applyData, loadLibrary]);
  useEffect(() => {
    if (!token) return;
    busy.current.add('feed');
    const locks = busy.current;
    const version = ++generation.current;
    let current = true;
    void fetchData()
      .then((data) => {
        if (current && version === generation.current) applyData(data);
      })
      .catch((e) => {
        if (current) setError(e instanceof Error ? e.message : 'โหลดโพสต์ไม่ได้');
      })
      .finally(() => {
        if (current) {
          locks.delete('feed');
          setLoading(false);
        }
      });
    return () => {
      current = false;
    };
  }, [token, fetchData, applyData]);
  const loadMore = async () => {
    if (!nextCursor || busy.current.has('feed') || loadedCategory !== category)
      return;
    busy.current.add('feed');
    setLoadingMore(true);
    const version = generation.current;
    try {
      const page = await request<{
        items: ApiPost[];
        nextCursor: string | null;
      }>(
        `/posts?cursor=${encodeURIComponent(nextCursor)}${category ? `&category=${encodeURIComponent(category)}` : ''}`,
      );
      if (version !== generation.current) return;
      merge(page.items);
      setFeedIds((old) => [
        ...new Set([...old, ...page.items.map((post) => post.id)]),
      ]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดโพสต์เพิ่มไม่ได้');
    } finally {
      if (version === generation.current) busy.current.delete('feed');
      setLoadingMore(false);
    }
  };
  const perform = async (key: string, work: () => Promise<void>) => {
    if (busy.current.has(key)) return false;
    busy.current.add(key);
    setError('');
    try {
      await work();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ทำรายการไม่ได้');
      return false;
    } finally {
      busy.current.delete(key);
    }
  };
  const loadComments = useCallback(
    async (id: string) => {
      try {
        const all: CommunityComment[] = [];
        let cursor: string | null = null;
        do {
          const page: { items: CommunityComment[]; nextCursor: string | null } =
            await request(
              `/posts/${id}/comments${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
            );
          all.push(...page.items);
          cursor = page.nextCursor;
        } while (cursor);
        setComments((old) => ({ ...old, [id]: all }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'โหลดความคิดเห็นไม่ได้');
      }
    },
    [request],
  );
  const loadPost = useCallback(
    async (id: string) => {
      try {
        const r = await request<{ item: ApiPost }>(`/posts/${id}`);
        merge([r.item]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'โหลดโพสต์ไม่ได้');
      }
    },
    [request, merge],
  );
  return {
    posts,
    liked,
    saved,
    comments,
    loading: loading || (!!token && !error && loadedCategory !== category),
    feedIds,
    setCategory: (value: string) => {
      setError('');
      setCategory(value);
    },
    loadingMore,
    error,
    mediaEnabled,
    nextCursor,
    refresh,
    loadMore,
    loadComments,
    clearError: () => setError(''),
    loadPost,
    loadLibrary,
    toggleLiked: (id: string) =>
      perform(`like:${id}`, async () => {
        const r = await request<{ item: ApiPost }>(
          `/posts/${id}/like`,
          liked.includes(id) ? 'DELETE' : 'PUT',
        );
        merge([r.item]);
      }),
    toggleSaved: (id: string) =>
      perform(`save:${id}`, async () => {
        const r = await request<{ item: ApiPost }>(
          `/posts/${id}/bookmark`,
          saved.includes(id) ? 'DELETE' : 'PUT',
        );
        merge([r.item]);
      }),
    report: (id: string) =>
      perform(`report:${id}`, async () => {
        await request(`/posts/${id}/report`, 'PUT');
      }),
    addComment: async (
      id: string,
      body: string,
      parentId: string | null,
      clientRequestId: string,
    ) => {
      await request(`/posts/${id}/comments`, 'POST', {
        body,
        parentId,
        clientRequestId,
      });
      await loadComments(id);
      const r = await request<{ item: ApiPost }>(`/posts/${id}`);
      merge([r.item]);
    },
    toggleCommentLike: (postId: string, commentId: string) =>
      perform(`comment:${commentId}`, async () => {
        const liked = comments[postId]?.find((c) => c.id === commentId)?.liked;
        await request(`/comments/${commentId}/like`, liked ? 'DELETE' : 'PUT');
        await loadComments(postId);
      }),
    publish: async (
      body: string,
      category: string,
      clientRequestId: string,
      mediaId?: string,
    ) => {
      const r = await request<{ item: ApiPost }>('/posts', 'POST', {
        body,
        category,
        clientRequestId,
        mediaIds: mediaId ? [mediaId] : [],
      });
      merge([r.item]);
      setFeedIds((old) => [r.item.id, ...old.filter((id) => id !== r.item.id)]);
    },
    upload: async (base64: string) =>
      request<{ id: string }>('/media', 'POST', { base64 }),
    newRequestId: requestId,
  };
}
