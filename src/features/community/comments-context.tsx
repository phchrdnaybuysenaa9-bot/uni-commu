import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CommentsSheet, type CommentDraft } from '@/components/community/comments-sheet';
import { useAuth } from '@/features/auth/auth-context';

const emptyDraft: CommentDraft = { text: '', replyTo: null };
const Context = createContext<{
  activePostId: string | null;
  openComments: (postId: string) => void;
} | null>(null);

/** Keep the modal outside feed lists so it has an independent scroll context. */
export function CommentsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [active, setActive] = useState<{ postId: string; userId: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CommentDraft>>({});
  const activePostId = active?.userId === userId ? active?.postId ?? null : null;
  const draftKey = `${userId}:${activePostId}`;
  const openComments = useCallback((postId: string) => {
    if (userId) setActive({ postId, userId });
  }, [userId]);
  const closeComments = useCallback(() => setActive(null), []);
  const value = useMemo(() => ({ activePostId, openComments }), [activePostId, openComments]);

  return <Context.Provider value={value}>
    {children}
    {activePostId && <CommentsSheet
      postId={activePostId}
      draft={drafts[draftKey] ?? emptyDraft}
      onChangeDraft={draft => setDrafts(old => ({ ...old, [draftKey]: draft }))}
      onClose={closeComments}
    />}
  </Context.Provider>;
}

export function useComments() {
  const value = useContext(Context);
  if (!value) throw new Error('CommentsProvider is required');
  return value;
}
